# Wrapper for Core Lightning (CLN)

This project wraps
[Core Lightning](https://github.com/ElementsProject/lightning) for StartOS.
Core Lightning is a lightweight, highly customizable and standard compliant
implementation of the [Lightning Network](https://lightning.network/) protocol.

## Dependencies

- [docker](https://docs.docker.com/get-docker)
- [docker-buildx](https://docs.docker.com/buildx/working-with-buildx/)
- [yq](https://mikefarah.gitbook.io/yq)
- [start-sdk](https://github.com/Start9Labs/start-os/blob/v0.3.5.1/core/install-sdk.sh)
- [make](https://www.gnu.org/software/make/)
- [deno](https://deno.land/)
- [md-packer](https://github.com/Start9Labs/md-packer)


## Cloning

Clone the project locally.

```
git clone git@github.com:Start9Labs/cln-startos.git
cd cln-startos
```

## Building

To build the project for all supported platforms, run the following command:

```
make
```

To build the project for a single platform, run:

```
# for amd64
make x86
```
or
```
# for arm64
make arm
```

## Installing (on Start9 server)

Run the following commands to determine successful install:
> :information_source: Change server-name.local to your Start9 server address

```
start-cli auth login
# Enter your StartOS password
start-cli --host https://server-name.local package install c-lightning.s9pk
```

If you already have your `start-cli` config file setup with a default `host`, you can install simply by running:

```
make install
```

> **Tip:** You can also install the `c-lightning.s9pk` using **Sideload Service** under the **System > Manage** section.