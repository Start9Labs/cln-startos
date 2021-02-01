# Spark Wallet

Spark wallet is a "remote control" interface for a remote c-lightning node intended for advanced users. If you experience issues, please report it to the [Spark team](https://github.com/shesek/spark-wallet/issues).

## Android

1. Download Orbot and Spark
1. In Orbot
    1. Turn on VPN Mode
    1. Under Tor-Enabled Apps, click the gear icon
    1. Add Spark and press the back arrow
    1. In the big onion at the top, click `Start`
1. In your phone settings, navigate to `Network & Internet > Advanced > Private DNS` and toggle Private DNS Mode off. 
1. Navigate to your Embassy services
1. Select Spark from the services dashboard
    1. Navigate to `Properties`
    1. Select the QR code icon next to `Pairing URL`
1. In the Spark app on your mobile device, select `Scan QR` under Server Settings
1. Scan the `Paring URL` QR code from Spark's `Properties` on your Embassy into the mobile Spark application
1. This will populate the Server URL and Access Key input fields
1. Save settings to complete the connection

* If Orbot is misbehaving try stopping other VPN services on the phone and/or restart Orbot.

## iOS

1. Spark does not exist as a mobile app for iOS. It exists as a [PWA](https://github.com/shesek/spark-wallet#progressive-web-app) and supports basically functionality, but not QR scanning or connecting with a remote node over Tor, which is necessary for connecting to your Embassy's c-lightning instance. 
