#!/bin/sh

export HOST_IP=$(ip -4 route list match 0/0 | awk '{print $3}')

configurator
lightningd || sleep 5000
