ASSETS := $(shell yq r manifest.yaml assets.*.src)
ASSET_PATHS := $(addprefix assets/,$(ASSETS))
VERSION_TAG := $(shell git --git-dir=lightning/.git describe --abbrev=0)
VERSION := $(VERSION_TAG:v%=%)
C_LIGHTNING_GIT_REF := $(shell cat .git/modules/lightning/HEAD)
C_LIGHTNING_GIT_FILE := $(addprefix .git/modules/lightning/,$(if $(filter ref:%,$(C_LIGHTNING_GIT_REF)),$(lastword $(C_LIGHTNING_GIT_REF)),HEAD))
HTTP_PLUGIN_SRC := $(shell find ./c-lightning-http-plugin/src -name '*.rs') c-lightning-http-plugin/Cargo.toml c-lightning-http-plugin/Cargo.lock
CONFIGURATOR_SRC := $(shell find ./configurator/src -name '*.rs') configurator/Cargo.toml configurator/Cargo.lock

.DELETE_ON_ERROR:
.PRECIOUS:

all: c-lightning.s9pk

install: c-lightning.s9pk
	appmgr install c-lightning.s9pk

c-lightning.s9pk: manifest.yaml config_spec.yaml config_rules.yaml image.tar instructions.md $(ASSET_PATHS)
	appmgr -vv pack $(shell pwd) -o c-lightning.s9pk
	appmgr -vv verify c-lightning.s9pk

image.tar: Dockerfile docker_entrypoint.sh configurator/target/armv7-unknown-linux-musleabihf/release/configurator c-lightning-http-plugin/target/armv7-unknown-linux-musleabihf/release/c-lightning-http-plugin $(C_LIGHTNING_GIT_FILE)
	DOCKER_CLI_EXPERIMENTAL=enabled docker buildx build --tag start9/c-lightning --platform=linux/arm/v7 -o type=docker,dest=image.tar .

configurator/target/armv7-unknown-linux-musleabihf/release/configurator: $(CONFIGURATOR_SRC)
	docker run --rm -it -v ~/.cargo/registry:/root/.cargo/registry -v "$(shell pwd)"/configurator:/home/rust/src start9/rust-musl-cross:armv7-musleabihf cargo +beta build --release
	docker run --rm -it -v ~/.cargo/registry:/root/.cargo/registry -v "$(shell pwd)"/configurator:/home/rust/src start9/rust-musl-cross:armv7-musleabihf musl-strip target/armv7-unknown-linux-musleabihf/release/configurator

c-lightning-http-plugin/target/armv7-unknown-linux-musleabihf/release/c-lightning-http-plugin: $(HTTP_PLUGIN_SRC)
	docker run --rm -it -v ~/.cargo/registry:/root/.cargo/registry -v "$(shell pwd)"/c-lightning-http-plugin:/home/rust/src start9/rust-musl-cross:armv7-musleabihf cargo +beta build --release
	docker run --rm -it -v ~/.cargo/registry:/root/.cargo/registry -v "$(shell pwd)"/c-lightning-http-plugin:/home/rust/src start9/rust-musl-cross:armv7-musleabihf musl-strip target/armv7-unknown-linux-musleabihf/release/c-lightning-http-plugin

manifest.yaml: $(C_LIGHTNING_GIT_FILE)
	yq w -i manifest.yaml version $(VERSION)
	yq w -i manifest.yaml release-notes https://github.com/ElementsProject/lightning/releases/tag/$(VERSION_TAG)