use std::fs::File;
use std::io::Write;
use std::net::{IpAddr, SocketAddr};
use std::path::Path;

use http::Uri;
use linear_map::LinearMap;
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
    bitcoind: BitcoinCoreConfig,
    rpc: RpcConfig,
    advanced: AdvancedConfig,
}

#[derive(serde::Deserialize)]
#[serde(tag = "type")]
#[serde(rename_all = "kebab-case")]
enum BitcoinCoreConfig {
    #[serde(rename_all = "kebab-case")]
    Internal {
        address: IpAddr,
        user: String,
        password: String,
    },
    #[serde(rename_all = "kebab-case")]
    External {
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
    rpc_username: Property,
    rpc_password: Property,
    node_alias: Property,
    node_id: Property
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

fn main() -> Result<(), anyhow::Error> {
    let config: Config =
        serde_yaml::from_reader(File::open("/root/.lightning/start9/config.yaml")?)?;
    {
        let mut outfile = File::create("/root/.lightning/config")?;

        let (bitcoin_rpc_user, bitcoin_rpc_pass, bitcoin_rpc_host, bitcoin_rpc_port) =
            match config.bitcoind {
                BitcoinCoreConfig::Internal {
                    address,
                    user,
                    password,
                } => (user, password, format!("{}", address), 8332),
                BitcoinCoreConfig::External {
                    address,
                    user,
                    password,
                } => (
                    user,
                    password,
                    format!("{}", address.host().unwrap()),
                    address.port_u16().unwrap_or(8332),
                ),
                BitcoinCoreConfig::QuickConnect { quick_connect_url } => {
                    parse_quick_connect_url(quick_connect_url)?
                }
            };
        let rpc_bind: SocketAddr = if config.rpc.enabled {
            ([0, 0, 0, 0], 8080).into()
        } else {
            ([127, 0, 0, 0], 8080).into()
        };
        let peer_tor_address = std::env::var("TOR_ADDRESS")?;
        let tor_proxy: SocketAddr = (std::env::var("HOST_IP")?.parse::<IpAddr>()?, 9050).into();

        write!(
            outfile,
            include_str!("config.template"),
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
        )?;
    }
    #[derive(serde::Deserialize)]
    struct NodeInfo {
        id: String,
        alias: String,
    }

    #[cfg(target_os = "linux")]
    nix::unistd::daemon(true, true)?;
    let node_info: NodeInfo;
    loop {
        let output = std::process::Command::new("lightning-cli").arg("getinfo").output()?;
        let res: Result<NodeInfo, _> = serde_json::from_str(&String::from_utf8(output.stdout)?);

        match res {
            Ok(n) => node_info = n,
            Err(e) => println!("error parsing header: {:?}", e),
        }
        std::thread::sleep(std::time::Duration::from_secs(1));
        break;
    }

    if config.rpc.enabled {
        serde_yaml::to_writer(
            File::create("/root/.lightning/start9/stats.yaml")?,
            &Properties {
                version: 2,
                data: Data {
                    quick_connect_url: Property::String {
                        value: format!(
                            "clightning-rpc://{}:{}@{}:{}",
                            config.rpc.user,
                            config.rpc.password,
                            std::env::var("TOR_ADDRESS")?,
                            8080
                        ),
                        description: None,
                        copyable: true,
                        qr: true,
                        masked: true,
                    },
                    rpc_username: Property::String {
                        value: format!(
                            "{}",
                            config.rpc.user,
                        ),
                        description: None,
                        copyable: true,
                        qr: false,
                        masked: true,
                    },
                    rpc_password: Property::String {
                        value: format!(
                            "{}",
                            config.rpc.password,
                        ),
                        description: None,
                        copyable: true,
                        qr: false,
                        masked: true,
                    },
                    node_id: Property::String {
                        value: format!(
                            "{}",
                            node_info.id,
                        ),
                        description: Some(format!("{}", "The node identifier. Provide this when connecting to other nodes.")),
                        copyable: true,
                        qr: false,
                        masked: true,
                    },
                    node_alias: Property::String {
                        value: format!(
                            "{}",
                            node_info.alias,
                        ),
                        description: Some(format!("{}", "The friendly identifier for your node")),
                        copyable: true,
                        qr: false,
                        masked: true,
                    },
                },
            },
        )?;
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
    for shared_dir in std::fs::read_dir("/root/.lightning/shared")? {
        let shared_dir = shared_dir?;
        if shared_dir.metadata()?.is_dir() {
            let link = shared_dir.path().join("lightning-rpc");
            if link.exists() {
                std::fs::remove_file(&link)?;
            }
            std::fs::hard_link(rpc_path, &link)?;
        }
    }
    Ok(())
}
