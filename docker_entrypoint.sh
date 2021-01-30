#!/bin/sh

export HOST_IP=$(ip -4 route list match 0/0 | awk '{print $3}')

RUST_BACKTRACE=1 configurator
exec tini lightningd
