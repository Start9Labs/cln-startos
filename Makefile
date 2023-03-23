BITCOIN_VERSION := "23.0"
C_LIGHTNING_GIT_REF := $(shell cat .git/modules/lightning/HEAD)
C_LIGHTNING_GIT_FILE := $(addprefix .git/modules/lightning/,$(if $(filter ref:%,$(C_LIGHTNING_GIT_REF)),$(lastword $(C_LIGHTNING_GIT_REF)),HEAD))
C_LIGHTNING_REST_SRC := $(shell find ./c-lightning-REST)
CLBOSS_SRC := $(shell find ./clboss)
DOC_ASSETS := $(shell find ./docs/assets)
# NOSTRIFY_SRC := $(shell find ./nostrify -name \*.py )
PKG_VERSION := $(shell yq e ".version" manifest.yaml)
PKG_ID := $(shell yq e ".id" manifest.yaml)
PLUGINS_SRC := $(shell find ./plugins)
HTTP_PLUGIN_SRC := $(shell find ./c-lightning-http-plugin/src) c-lightning-http-plugin/Cargo.toml c-lightning-http-plugin/Cargo.lock
VERSION := $(shell yq e ".version" manifest.yaml)
TS_FILES := $(shell find . -name \*.ts )

.DELETE_ON_ERROR:

all: verify

clean:
	rm -rf docker-images
	rm -f  $(PKG_ID).s9pk
	rm -f image.tar
	rm -f scripts/*.js

# for rebuilding just the arm image. will include docker-images/x86_64.tar into the s9pk if it exists
arm: verify-arm

# for rebuilding just the x86 image. will include docker-images/aarch64.tar into the s9pk if it exists
x86: verify-x86

verify: $(PKG_ID).s9pk
	embassy-sdk verify s9pk $(PKG_ID).s9pk

verify-arm: $(PKG_ID)-arm.s9pk
	embassy-sdk verify s9pk $(PKG_ID)-arm.s9pk
	mv $(PKG_ID)-arm.s9pk $(PKG_ID).s9pk

verify-x86: $(PKG_ID)-x86.s9pk
	embassy-sdk verify s9pk $(PKG_ID)-x86.s9pk
	mv $(PKG_ID)-x86.s9pk $(PKG_ID).s9pk

install: $(PKG_ID).s9pk
	embassy-cli package install $(PKG_ID).s9pk

$(PKG_ID).s9pk: manifest.yaml docker-images/aarch64.tar docker-images/x86_64.tar instructions.md $(ASSET_PATHS) scripts/embassy.js
	embassy-sdk pack

$(PKG_ID)-arm.s9pk: manifest.yaml docker-images/aarch64.tar instructions.md $(ASSET_PATHS) scripts/embassy.js
	embassy-sdk pack
	mv $(PKG_ID).s9pk $(PKG_ID)-arm.s9pk

$(PKG_ID)-x86.s9pk: manifest.yaml docker-images/x86_64.tar instructions.md $(ASSET_PATHS) scripts/embassy.js
	embassy-sdk pack
	mv $(PKG_ID).s9pk $(PKG_ID)-x86.s9pk

docker-images/aarch64.tar: Dockerfile docker_entrypoint.sh check-rpc.sh check-synced.sh $(C_LIGHTNING_GIT_FILE) $(PLUGINS_SRC) $(C_LIGHTNING_REST_SRC) manifest.yaml
	mkdir -p docker-images
	docker buildx build --tag start9/$(PKG_ID)/main:$(PKG_VERSION) --build-arg BITCOIN_VERSION=$(BITCOIN_VERSION) --build-arg ARCH=aarch64 --build-arg PLATFORM=arm64 --platform=linux/arm64/v8 -o type=docker,dest=docker-images/aarch64.tar .

docker-images/x86_64.tar: Dockerfile docker_entrypoint.sh check-rpc.sh check-synced.sh $(C_LIGHTNING_GIT_FILE) $(PLUGINS_SRC) $(C_LIGHTNING_REST_SRC) manifest.yaml
	mkdir -p docker-images
	docker buildx build --tag start9/$(PKG_ID)/main:$(PKG_VERSION) --build-arg BITCOIN_VERSION=$(BITCOIN_VERSION) --build-arg ARCH=x86_64 --build-arg PLATFORM=amd64 --platform=linux/amd64 -o type=docker,dest=docker-images/x86_64.tar .

# c-lightning-http-plugin/target/aarch64-unknown-linux-musl/release/c-lightning-http-plugin: $(HTTP_PLUGIN_SRC)
# 	docker run --rm -it -v ~/.cargo/registry:/root/.cargo/registry -v "$(shell pwd)"/c-lightning-http-plugin:/home/rust/src start9/rust-musl-cross:aarch64-musl cargo +beta build --release
# 	docker run --rm -it -v ~/.cargo/registry:/root/.cargo/registry -v "$(shell pwd)"/c-lightning-http-plugin:/home/rust/src start9/rust-musl-cross:aarch64-musl musl-strip target/aarch64-unknown-linux-musl/release/c-lightning-http-plugin

# c-lightning-http-plugin/target/x86_64-unknown-linux-musl/release/c-lightning-http-plugin: $(HTTP_PLUGIN_SRC)
# # cargo +beta build --release --target=x86_64-unknown-linux-gnu --manifest-path=c-lightning-http-plugin/Cargo.toml
# 	docker run --rm -it -v ~/.cargo/registry:/root/.cargo/registry -v "$(shell pwd)"/c-lightning-http-plugin:/home/rust/src start9/rust-musl-cross:aarch64-musl cargo +beta build --release
# 	docker run --rm -it -v ~/.cargo/registry:/root/.cargo/registry -v "$(shell pwd)"/c-lightning-http-plugin:/home/rust/src start9/rust-musl-cross:x86_64-musl musl-strip target/x86_64-unknown-linux-musl/release/c-lightning-http-plugin

#clboss/target/clboss: $(CLBOSS_SRC)
# mkdir -p clboss/target/
# docker run --rm -it -v "$(shell pwd)"/clboss/target/clboss:/usr/local/bin/clboss start9/rust-musl-cross:aarch64-musl cargo +beta build --release
#	DOCKER_CLI_EXPERIMENTAL=enabled docker buildx build -v "$(shell pwd)"/clboss/target/clboss:/usr/local/bin/clboss --platform=linux/arm64/v8 clboss.dockerfile

scripts/embassy.js: $(TS_FILES)
	deno bundle scripts/embassy.ts scripts/embassy.js

instructions.md: docs/instructions.md $(DOC_ASSETS)
	cd docs && md-packer < instructions.md > ../instructions.md
