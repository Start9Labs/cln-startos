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

## [Fully Noded](https://github.com/Fonta1n3/FullyNoded)

### Available for
- iOS
- MacOS

### Instructions
1. In Fully Noded, click the lightning bolt icon at the top of the screen.
1. Click "add a node"
1. Enter your Core Lightning credentials. You can do this in one of two ways:
    1. Use Fully Noded to scan your QuickConnect QR code (located in `Services > Core Lightning > Properties`)
    1. Copy/paste your Core Lightning Tor Address (located in `Services > Core Lightning`) _with :8080 appended_ (eg. sometoraddress.onion:8080), as well as you RPC username and password (located in `Services > Core Lightning > Properties`).
