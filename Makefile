ASSETS := $(shell yq r manifest.yaml assets.*.src)
ASSET_PATHS := $(addprefix assets/,$(ASSETS))
VERSION := $(shell yq r manifest.yaml version)

.DELETE_ON_ERROR:

all: c-lightning.s9pk

install: c-lightning.s9pk
	appmgr install c-lightning.s9pk

c-lightning.s9pk: manifest.yaml config_spec.yaml config_rules.yaml image.tar instructions.md $(ASSET_PATHS)
	appmgr -vv pack $(shell pwd) -o c-lightning.s9pk
	appmgr -vv verify c-lightning.s9pk

image.tar: Dockerfile docker_entrypoint.sh
	DOCKER_CLI_EXPERIMENTAL=enabled docker buildx build --tag start9/c-lightning --platform=linux/arm/v7 -o type=docker,dest=image.tar .

