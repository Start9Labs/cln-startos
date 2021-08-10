ASSETS := $(shell yq e ".assets.[].src" manifest.yaml)
ASSET_PATHS := $(addprefix assets/,$(ASSETS))
BITCOIN_VERSION := "0.21.0"
C_LIGHTNING_GIT_REF := $(shell cat .git/modules/lightning/HEAD)
C_LIGHTNING_GIT_FILE := $(addprefix .git/modules/lightning/,$(if $(filter ref:%,$(C_LIGHTNING_GIT_REF)),$(lastword $(C_LIGHTNING_GIT_REF)),HEAD))
C_LIGHTNING_REST_SRC := $(shell find ./c-lightning-REST)
PLUGINS_SRC := $(shell find ./plugins)
HTTP_PLUGIN_SRC := $(shell find ./c-lightning-http-plugin/src) c-lightning-http-plugin/Cargo.toml c-lightning-http-plugin/Cargo.lock
CONFIGURATOR_SRC := $(shell find ./configurator/src) configurator/Cargo.toml configurator/Cargo.lock

.DELETE_ON_ERROR:

all: c-lightning.s9pk

install: c-lightning.s9pk
	embassy-sdk pack

c-lightning.s9pk: manifest.yaml config_spec.yaml config_rules.yaml image.tar instructions.md $(ASSET_PATHS)
	appmgr -vv pack $(shell pwd) -o c-lightning.s9pk
	appmgr -vv verify c-lightning.s9pk

image.tar: Dockerfile docker_entrypoint.sh configurator/target/aarch64-unknown-linux-musl/release/configurator c-lightning-http-plugin/target/aarch64-unknown-linux-musl/release/c-lightning-http-plugin $(C_LIGHTNING_GIT_FILE) $(PLUGINS_SRC) $(C_LIGHTNING_REST_SRC)
	DOCKER_CLI_EXPERIMENTAL=enabled docker buildx build --tag start9/c-lightning --build-arg BITCOIN_VERSION=$(BITCOIN_VERSION) --platform=linux/arm64 -o type=docker,dest=image.tar .

configurator/target/aarch64-unknown-linux-musl/release/configurator: $(CONFIGURATOR_SRC)
	docker run --rm -it -v ~/.cargo/registry:/root/.cargo/registry -v "$(shell pwd)"/configurator:/home/rust/src start9/rust-musl-cross:aarch64-musl cargo +beta build --release
	docker run --rm -it -v ~/.cargo/registry:/root/.cargo/registry -v "$(shell pwd)"/configurator:/home/rust/src start9/rust-musl-cross:aarch64-musl musl-strip target/aarch64-unknown-linux-musl/release/configurator

c-lightning-http-plugin/target/aarch64-unknown-linux-musl/release/c-lightning-http-plugin: $(HTTP_PLUGIN_SRC)
	docker run --rm -it -v ~/.cargo/registry:/root/.cargo/registry -v "$(shell pwd)"/c-lightning-http-plugin:/home/rust/src start9/rust-musl-cross:aarch64-musl cargo +beta build --release
	docker run --rm -it -v ~/.cargo/registry:/root/.cargo/registry -v "$(shell pwd)"/c-lightning-http-plugin:/home/rust/src start9/rust-musl-cross:aarch64-musl musl-strip target/aarch64-unknown-linux-musl/release/c-lightning-http-plugin
