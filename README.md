# Wrapper for c-lightning

This project wraps [c-lightning](https://github.com/ElementsProject/lightning
) for EmbassyOS. c-lightning is a lightweight, highly customizable and standard compliant implementation of the [Lightning Network](https://lightning.network/) protocol.

## Dependencies

- [docker](https://docs.docker.com/get-docker)
- [docker-buildx](https://docs.docker.com/buildx/working-with-buildx/)
- [yq](https://mikefarah.gitbook.io/yq)
- [appmgr](https://github.com/Start9Labs/appmgr)
- [make](https://www.gnu.org/software/make/)

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
make
```

## Installing (on Embassy)

SSH into an Embassy device.
`scp` the `.s9pk` to any directory from your local machine.
Run the following command to determine successful install:

```
appmgr install c-lightning.s9pk
```
