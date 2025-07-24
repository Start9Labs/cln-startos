# Core Lightning - Alby Browser Extension

Alby is a browser extension that can be connected to your lightning node a number of ways. This guide will go over direct connections between Alby and your **Core Lightning** node.

WARNING: If you are looking for Alby Hub, this is not it. To use Alby Hub you must instead run LND or use the internal LDK node.


1. Download the Alby extension by visiting the [Alby Github](https://github.com/getAlby/lightning-browser-extension#installation), selecting your browser, and installing.

1. On the Alby welcome screen, select **Get Started**.

1. Create a strong password and store it somewhere safe, like your Vaultwarden password manager.

1. On the next screen, select **Bring Your Own Wallet** and click **Connect**.

   ![Connect Alby](../assets/connect-alby-connect-start9-1.png)

1. Click **Start9** first...

   ![Connect Alby](../assets/connect-alby-connect-start9-2.png)

1. ... and only then **CLN**.

   ![Connect Alby](../assets/connect-alby-connect-start9-3.png)

1. You will see the following fields to fill out:

   ![Connect Alby](../assets/connect-alby-cln-empty.png)

1. For "Host" this is your Peer Interface - find this in the **Interfaces** section within the CLN service on your server. Copy the prefer interface type's address shown here and paste it into **Host** within Alby:

   - If you are using the Tor URL, Alby will pick up that you are connecting over Tor and suggest using their Companion App (only needed if your browser isn’t setup to use Tor) or using Tor natively which you will be able to do. Select **TOR (native)** and click **Continue**. (If this does not work, please ensure that Tor is running on your system and that Firefox is configured to use it. If you can’t get this to work it’s OK to use the Companion App - but you will have a better experience with your Start9 server elsewhere if you take the time to get Tor running on your devices.)

   – If you are using clearnet, make sure you make the interface Public

1. For **Public key** enter your **Node Id** found within the Actions area of the CLN service on your server.

1. To generate a rune on StartOS you will need to navigate to Core Lightning > Actions > Generate Rune. Then copy the value and paste it into Alby.

1. Enter the port number for your chosen interface in **Port**.

1. Click **Continue**. Once the connection is completed you will see a success page that displays the balance of your CLN node in Sats.



Alby is now connected to your CLN node!
