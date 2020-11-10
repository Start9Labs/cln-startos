use std::fs::File;
use std::io::Write;
use std::net::{IpAddr, SocketAddr};

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
                },
            },
        )?;
    }
    Ok(())
}
