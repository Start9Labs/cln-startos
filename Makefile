BITCOIN_VERSION := "25.0.0"
C_LIGHTNING_GIT_REF := $(shell cat .git/modules/lightning/HEAD)
C_LIGHTNING_GIT_FILE := $(addprefix .git/modules/lightning/,$(if $(filter ref:%,$(C_LIGHTNING_GIT_REF)),$(lastword $(C_LIGHTNING_GIT_REF)),HEAD))
C_LIGHTNING_REST_SRC := $(shell find ./c-lightning-REST)
CLBOSS_SRC := $(shell find ./clboss)
DOC_ASSETS := $(shell find ./docs/assets)
PKG_VERSION := $(shell yq e ".version" manifest.yaml)
PKG_ID := $(shell yq e ".id" manifest.yaml)
PLUGINS_SRC := $(shell find ./plugins)
HTTP_PLUGIN_SRC := $(shell find ./c-lightning-http-plugin/src) c-lightning-http-plugin/Cargo.toml c-lightning-http-plugin/Cargo.lock
VERSION := $(shell yq e ".version" manifest.yaml)
TS_FILES := $(shell find . -name \*.ts )

.DELETE_ON_ERROR:

all: submodule-update instructions.md verify

clean:
	rm -rf docker-images
	rm -f $(PKG_ID).s9pk
	rm -f scripts/*.js

submodule-update:
	@if [ -z "$(shell git submodule status | egrep -v '^ '|awk '{print $2}')" ]; then \
		echo "\nAll submodules ready for build.\n"; \
	else \
		echo "\nPulling submodules...\n"; \
		git submodule update --init --progress; \
	fi

arm:
	@rm -f docker-images/x86_64.tar
	@ARCH=aarch64 $(MAKE)

x86:
	@rm -f docker-images/aarch64.tar
	@ARCH=x86_64 $(MAKE)

verify: $(PKG_ID).s9pk
	@embassy-sdk verify s9pk $(PKG_ID).s9pk
	@echo " Done!"
	@echo "   Filesize: $(shell du -h $(PKG_ID).s9pk) is ready"

install:
ifeq (,$(wildcard ~/.embassy/config.yaml))
	@echo; echo "You must define \"host: http://embassy-server-name.local\" in ~/.embassy/config.yaml config file first"; echo
else
	embassy-cli package install $(PKG_ID).s9pk
endif

$(PKG_ID).s9pk: manifest.yaml docker-images/aarch64.tar docker-images/x86_64.tar instructions.md $(ASSET_PATHS) scripts/embassy.js
ifeq ($(ARCH),aarch64)
	@echo "embassy-sdk: Preparing aarch64 package ..."
else ifeq ($(ARCH),x86_64)
	@echo "embassy-sdk: Preparing x86_64 package ..."
else
	@echo "embassy-sdk: Preparing Universal Package ..."
endif
	@embassy-sdk pack

docker-images/aarch64.tar: Dockerfile docker_entrypoint.sh check-rpc.sh check-synced.sh $(C_LIGHTNING_GIT_FILE) $(PLUGINS_SRC) $(C_LIGHTNING_REST_SRC) manifest.yaml
ifeq ($(ARCH),x86_64)
else
	mkdir -p docker-images
	docker buildx build --tag start9/$(PKG_ID)/main:$(PKG_VERSION) --build-arg BITCOIN_VERSION=$(BITCOIN_VERSION) --build-arg ARCH=aarch64 --build-arg PLATFORM=arm64 --platform=linux/arm64/v8 -o type=docker,dest=docker-images/aarch64.tar .
endif

docker-images/x86_64.tar: Dockerfile docker_entrypoint.sh check-rpc.sh check-synced.sh $(C_LIGHTNING_GIT_FILE) $(PLUGINS_SRC) $(C_LIGHTNING_REST_SRC) manifest.yaml
ifeq ($(ARCH),aarch64)
else
	mkdir -p docker-images
	docker buildx build --tag start9/$(PKG_ID)/main:$(PKG_VERSION) --build-arg BITCOIN_VERSION=$(BITCOIN_VERSION) --build-arg ARCH=x86_64 --build-arg PLATFORM=amd64 --platform=linux/amd64 -o type=docker,dest=docker-images/x86_64.tar .
endif
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
	@echo "Generating instructions.md\n"
	@cd docs && md-packer < instructions.md > ../instructions.md
