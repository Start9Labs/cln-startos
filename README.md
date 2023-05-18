# Wrapper for Core Lightning (CLN)

This project wraps
[Core Lightning](https://github.com/ElementsProject/lightning) for EmbassyOS.
Core Lightning is a lightweight, highly customizable and standard compliant
implementation of the [Lightning Network](https://lightning.network/) protocol.

## Dependencies

- [docker](https://docs.docker.com/get-docker)
- [docker-buildx](https://docs.docker.com/buildx/working-with-buildx/)
- [yq](https://mikefarah.gitbook.io/yq)
- [embassy-sdk](https://github.com/Start9Labs/embassy-os/tree/master/backend)
- [make](https://www.gnu.org/software/make/)
- [deno](https://deno.land/)
- [md-packer](https://github.com/Start9Labs/md-packer)


## Cloning

Clone the project locally. Note the submodule link to the original project(s).

```
git clone git@github.com:Start9Labs/c-lightning-wrapper.git
cd c-lightning-wrapper
git submodule update --init
```

## Building

To build the project, run the following commands:

```
git submodule update --init --recursive 
make
```

## Installing (on Embassy)

SSH into an Embassy device. `scp` the `.s9pk` to any directory from your local
machine. Then install:

```
embassy-cli package install /path/to/c-lightning.s9pk
```
