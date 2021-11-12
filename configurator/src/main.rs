use std::fs::File;
use std::io::Write;
use std::net::{IpAddr, SocketAddr};
use std::path::Path;

use http::Uri;
use linear_map::LinearMap;
use rand::Rng;
use serde::{
    de::{Deserializer, Error as DeserializeError, Unexpected},
    Deserialize,
};

fn deserialize_parse<'de, D: Deserializer<'de>, T: std::str::FromStr>(
    deserializer: D,
) -> Result<T, D::Error> {
    let s: String = Deserialize::deserialize(deserializer)?;
    s.parse()
        .map_err(|_| DeserializeError::invalid_value(Unexpected::Str(&s), &"a valid URI"))
}

fn parse_quick_connect_url(url: Uri) -> Result<(String, String, String, u16), anyhow::Error> {
    let auth = url
        .authority()
        .ok_or_else(|| anyhow::anyhow!("invalid Quick Connect URL"))?;
    let mut auth_split = auth.as_str().split(|c| c == ':' || c == '@');
    let user = auth_split
        .next()
        .ok_or_else(|| anyhow::anyhow!("missing user"))?;
    let pass = auth_split
        .next()
        .ok_or_else(|| anyhow::anyhow!("missing pass"))?;
    let host = url.host().unwrap();
    let port = url.port_u16().unwrap_or(8332);
    Ok((user.to_owned(), pass.to_owned(), host.to_owned(), port))
}

#[derive(Deserialize)]
struct Config {
    alias: Option<String>,
    color: String,
    bitcoind: BitcoinCoreConfig,
    rpc: RpcConfig,
    advanced: AdvancedConfig,
}

#[derive(serde::Deserialize)]
#[serde(tag = "type")]
#[serde(rename_all = "kebab-case")]
enum BitcoinCoreConfig {
    #[serde(rename_all = "kebab-case")]
    Internal { user: String, password: String },
    #[serde(rename_all = "kebab-case")]
    External {
        connection_settings: ExternalBitcoinCoreConfig,
    },
}

#[derive(serde::Deserialize)]
#[serde(tag = "type")]
#[serde(rename_all = "kebab-case")]
enum ExternalBitcoinCoreConfig {
    #[serde(rename_all = "kebab-case")]
    Manual {
        #[serde(deserialize_with = "deserialize_parse")]
        address: Uri,
        user: String,
        password: String,
    },
    #[serde(rename_all = "kebab-case")]
    QuickConnect {
        #[serde(deserialize_with = "deserialize_parse")]
        quick_connect_url: Uri,
    },
}
#[derive(Deserialize)]
struct RpcConfig {
    enabled: bool,
    user: String,
    password: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "kebab-case")]
struct AdvancedConfig {
    tor_only: bool,
    fee_base: usize,
    fee_rate: usize,
    min_capacity: usize,
    ignore_fee_limits: bool,
    funding_confirms: usize,
    cltv_delta: usize,
    wumbo_channels: bool,
    experimental: ExperimentalConfig,
}

#[derive(Deserialize)]
#[serde(rename_all = "kebab-case")]
struct ExperimentalConfig {
    dual_fund: bool,
    onion_messages: bool,
    offers: bool,
    shutdown_wrong_funding: bool,
}

#[derive(serde::Serialize)]
pub struct Properties {
    version: u8,
    data: Data,
}

#[derive(serde::Serialize)]
pub struct Data {
    #[serde(rename = "Quick Connect URL")]
    quick_connect_url: Property,
    #[serde(rename = "RPC Username")]
    rpc_username: Property,
    #[serde(rename = "RPC Password")]
    rpc_password: Property,
    #[serde(rename = "Node Alias")]
    node_alias: Property,
    #[serde(rename = "Node URI")]
    node_uri: Property,
    #[serde(rename = "Node ID")]
    node_id: Property,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "kebab-case")]
#[serde(tag = "type")]
pub enum Property {
    #[serde(rename_all = "kebab-case")]
    String {
        value: String,
        description: Option<String>,
        copyable: bool,
        qr: bool,
        masked: bool,
    },
    #[serde(rename_all = "kebab-case")]
    Object {
        value: LinearMap<String, Property>,
        description: Option<String>,
    },
}

fn get_alias(config: &Config) -> Result<String, anyhow::Error> {
    Ok(match &config.alias {
        // if it isn't defined in the config
        None => {
            // generate it and write it to a file
            let alias_path = Path::new("/root/.lightning/default_alias.txt");
            if alias_path.exists() {
                std::fs::read_to_string(alias_path)?
            } else {
                let mut rng = rand::thread_rng();
                let default_alias = format!("start9-{:#010x}", rng.gen::<u64>());
                std::fs::write(alias_path, &default_alias)?;
                default_alias
            }
        }
        Some(a) => a.clone(),
    })
}

fn main() -> Result<(), anyhow::Error> {
    let config: Config =
        serde_yaml::from_reader(File::open("/root/.lightning/start9/config.yaml")?)?;
    let mut outfile = File::create("/root/.lightning/config")?;
    let alias = get_alias(&config)?;

    let (bitcoin_rpc_user, bitcoin_rpc_pass, bitcoin_rpc_host, bitcoin_rpc_port) =
        match config.bitcoind {
            BitcoinCoreConfig::Internal { user, password } => {
                (user, password, format!("{}", "btc-rpc-proxy.embassy"), 8332)
            }
            BitcoinCoreConfig::External {
                connection_settings:
                    ExternalBitcoinCoreConfig::Manual {
                        address,
                        user,
                        password,
                    },
            } => (
                user,
                password,
                format!("{}", address.host().unwrap()),
                address.port_u16().unwrap_or(8332),
            ),
            BitcoinCoreConfig::External {
                connection_settings: ExternalBitcoinCoreConfig::QuickConnect { quick_connect_url },
            } => parse_quick_connect_url(quick_connect_url)?,
        };
    let rpc_bind: SocketAddr = if config.rpc.enabled {
        ([0, 0, 0, 0], 8080).into()
    } else {
        ([127, 0, 0, 0], 8080).into()
    };
    let peer_tor_address = std::env::var("PEER_TOR_ADDRESS")?;
    let tor_proxy: SocketAddr = (std::env::var("EMBASSY_IP")?.parse::<IpAddr>()?, 9050).into();

    write!(
        outfile,
        include_str!("config.template"),
        alias = config.alias.unwrap_or(alias),
        rgb = config.color,
        bitcoin_rpc_user = bitcoin_rpc_user,
        bitcoin_rpc_pass = bitcoin_rpc_pass,
        bitcoin_rpc_host = bitcoin_rpc_host,
        bitcoin_rpc_port = bitcoin_rpc_port,
        rpc_user = config.rpc.user,
        rpc_pass = config.rpc.password,
        rpc_bind = rpc_bind,
        peer_tor_address = peer_tor_address,
        tor_proxy = tor_proxy,
        tor_only = config.advanced.tor_only,
        fee_base = config.advanced.fee_base,
        fee_rate = config.advanced.fee_rate,
        min_capacity = config.advanced.min_capacity,
        ignore_fee_limits = config.advanced.ignore_fee_limits,
        funding_confirms = config.advanced.funding_confirms,
        cltv_delta = config.advanced.cltv_delta,
        enable_wumbo = if config.advanced.wumbo_channels {
            "large-channels"
        } else {
            ""
        },
        enable_experimental_dual_fund = if config.advanced.experimental.dual_fund {
            "experimental-dual-fund"
        } else {
            ""
        },
        enable_experimental_onion_messages = if config.advanced.experimental.onion_messages {
            "experimental-onion-messages"
        } else {
            ""
        },
        enable_experimental_offers = if config.advanced.experimental.offers {
            "experimental-offers"
        } else {
            ""
        },
        enable_experimental_shutdown_wrong_funding =
            if config.advanced.experimental.shutdown_wrong_funding {
                "experimental-shutdown-wrong-funding"
            } else {
                ""
            }
    )?;
    drop(outfile);
    #[derive(serde::Deserialize)]
    struct NodeInfo {
        id: String,
        alias: String,
    }

    let rpc_path = Path::new("/root/.lightning/bitcoin/lightning-rpc");
    if rpc_path.exists() {
        std::fs::remove_file(rpc_path)?;
    }
    #[cfg(target_os = "linux")]
    nix::unistd::daemon(true, true)?;
    while !rpc_path.exists() {
        std::thread::sleep(std::time::Duration::from_secs(1));
    }
    let shared_path = Path::new("/root/.lightning/shared");
    let link = shared_path.join("lightning-rpc");
    if link.exists() {
        std::fs::remove_file(&link)?;
    }
    std::fs::hard_link(rpc_path, &link)?;

    let node_info: NodeInfo = {
        let output = std::process::Command::new("lightning-cli")
            .arg("getinfo")
            .output()?;
        if !output.status.success() {
            return Err(anyhow::anyhow!(
                "error in lightning-cli: {:?}",
                String::from_utf8(output.stderr)
            ));
        }
        serde_json::from_str(&String::from_utf8(output.stdout)?)?
    };

    if config.rpc.enabled {
        serde_yaml::to_writer(
            File::create("/root/.lightning/start9/stats.yaml")?,
            &Properties {
                version: 2,
                data: Data {
                    quick_connect_url: Property::String {
                        value: format!(
                            "clightning-rpc://{}:{}@{}:{}",
                            config.rpc.user, config.rpc.password, peer_tor_address, 8080
                        ),
                        description: Some(
                            "A convenient way to connect a wallet to a remote node".to_owned(),
                        ),
                        copyable: true,
                        qr: true,
                        masked: true,
                    },
                    node_uri: Property::String {
                        value: format!("{}@{}", node_info.id, peer_tor_address),
                        description: Some("Enables connecting to another remote node".to_owned()),
                        copyable: true,
                        qr: true,
                        masked: true,
                    },
                    rpc_password: Property::String {
                        value: format!("{}", config.rpc.password,),
                        description: Some("Password for RPC connections".to_owned()),
                        copyable: true,
                        qr: false,
                        masked: true,
                    },
                    rpc_username: Property::String {
                        value: format!("{}", config.rpc.user,),
                        description: Some("Username for RPC connections".to_owned()),
                        copyable: true,
                        qr: false,
                        masked: false,
                    },
                    node_id: Property::String {
                        value: format!("{}", node_info.id,),
                        description: Some(
                            "The node identifier that can be used for connecting to other nodes"
                                .to_owned(),
                        ),
                        copyable: true,
                        qr: false,
                        masked: false,
                    },
                    node_alias: Property::String {
                        value: format!("{}", node_info.alias,),
                        description: Some("The friendly identifier for your node".to_owned()),
                        copyable: true,
                        qr: false,
                        masked: false,
                    },
                },
            },
        )?;
    }

    Ok(())
}
