# Compatible Wallets

## Spark Wallet
Spark wallet is a "remote control" interface for a remote Core Lightning node intended for advanced users. If you experience issues with the mobile or desktop applications, please reach out to the [Spark team](https://github.com/shesek/spark-wallet/issues) for support. 
### Available for
- StartOS
- [Desktop](https://github.com/shesek/spark-wallet#desktop-apps)
    - Linux
    - macOS
    - Windows
- [Android](https://github.com/shesek/spark-wallet#mobile-app)
- [PWA](https://github.com/shesek/spark-wallet#progressive-web-app)
    - iOS
    - Android
    - Desktop

### Instructions
1. For use with the StartOS, download Spark Wallet from the Start9 Service Marketplace and follow instructions.
1. For mobile app integrations, view the [tutorial](/docs/integrations/spark.md).

## [Zeus](https://github.com/ZeusLN/zeus)

### Available for
- iOS
- Android

### Instructions
1. In Zeus, click `scan node config`.
1. Scan the `REST Quick Connect` QR code from CLN Properties (`Services > Core Lightning > Properties`).
    1. Alternatively, you can individually copy and paste the hostname, port, and macaroon from `Services > Core Lightning > Properties` in the respective fields within the Zeus app. Make sure to select `Core Lightning (c-lightning-REST)` as the `Node interface` and toggle `Use Tor` on.

## [Fully Noded](https://github.com/Fonta1n3/FullyNoded)

### Available for
- iOS
- macOS

### Instructions
1. In the Fully Noded app navigate to Settings > Node manager.
1. Select the `+` icon in the top right followed by selecting the `Core Lightning` node option. Copy your Sparko Address, Sparko port, and Sparko Key from the `Properties` section of CLN on StartOS - paste these into the respective fields of `Node Credentials` on the Fully Noded app. The address field format should be structured as `address:port` i.e. `xyz.onion:9737`. *Note: QR code scanning the Sparko is not supported by Fully Noded at this time.*