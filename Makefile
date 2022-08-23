BITCOIN_VERSION := "22.0"
C_LIGHTNING_GIT_REF := $(shell cat .git/modules/lightning/HEAD)
C_LIGHTNING_GIT_FILE := $(addprefix .git/modules/lightning/,$(if $(filter ref:%,$(C_LIGHTNING_GIT_REF)),$(lastword $(C_LIGHTNING_GIT_REF)),HEAD))
C_LIGHTNING_REST_SRC := $(shell find ./c-lightning-REST)
CLBOSS_SRC := $(shell find ./clboss)
DOC_ASSETS := $(shell find ./docs/assets)
PLUGINS_SRC := $(shell find ./plugins)
HTTP_PLUGIN_SRC := $(shell find ./c-lightning-http-plugin/src) c-lightning-http-plugin/Cargo.toml c-lightning-http-plugin/Cargo.lock
VERSION := $(shell yq e ".version" manifest.yaml)
TS_FILES := $(shell find . -name \*.ts )

.DELETE_ON_ERROR:

all: verify

verify: c-lightning.s9pk
	embassy-sdk verify s9pk c-lightning.s9pk

install: c-lightning.s9pk
	embassy-cli package install c-lightning.s9pk

c-lightning.s9pk: manifest.yaml image.tar instructions.md $(ASSET_PATHS)  scripts/embassy.js
	embassy-sdk pack

#image.tar: Dockerfile docker_entrypoint.sh check-rpc.sh check-synced.sh c-lightning-http-plugin/target/aarch64-unknown-linux-musl/release/c-lightning-http-plugin clboss/target/clboss $(C_LIGHTNING_GIT_FILE) $(PLUGINS_SRC) $(C_LIGHTNING_REST_SRC) manifest.yaml
image.tar: Dockerfile docker_entrypoint.sh check-rpc.sh check-synced.sh c-lightning-http-plugin/target/aarch64-unknown-linux-musl/release/c-lightning-http-plugin $(C_LIGHTNING_GIT_FILE) $(PLUGINS_SRC) $(C_LIGHTNING_REST_SRC) manifest.yaml
	DOCKER_CLI_EXPERIMENTAL=enabled docker buildx build --tag start9/c-lightning/main:$(VERSION) --build-arg BITCOIN_VERSION=$(BITCOIN_VERSION) --platform=linux/arm64/v8 -o type=docker,dest=image.tar .

c-lightning-http-plugin/target/aarch64-unknown-linux-musl/release/c-lightning-http-plugin: $(HTTP_PLUGIN_SRC)
	docker run --rm -it -v ~/.cargo/registry:/root/.cargo/registry -v "$(shell pwd)"/c-lightning-http-plugin:/home/rust/src start9/rust-musl-cross:aarch64-musl cargo +beta build --release
	docker run --rm -it -v ~/.cargo/registry:/root/.cargo/registry -v "$(shell pwd)"/c-lightning-http-plugin:/home/rust/src start9/rust-musl-cross:aarch64-musl musl-strip target/aarch64-unknown-linux-musl/release/c-lightning-http-plugin

#clboss/target/clboss: $(CLBOSS_SRC)
# mkdir -p clboss/target/
# docker run --rm -it -v "$(shell pwd)"/clboss/target/clboss:/usr/local/bin/clboss start9/rust-musl-cross:aarch64-musl cargo +beta build --release
#	DOCKER_CLI_EXPERIMENTAL=enabled docker buildx build -v "$(shell pwd)"/clboss/target/clboss:/usr/local/bin/clboss --platform=linux/arm64/v8 clboss.dockerfile

scripts/embassy.js: $(TS_FILES)
	deno bundle scripts/embassy.ts scripts/embassy.js

instructions.md: docs/instructions.md $(DOC_ASSETS)
	cd docs && md-packer < instructions.md > ../instructions.md
