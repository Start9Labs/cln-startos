#!/bin/sh

compat duplicity restore /mnt/backup /root/.lightning
mkdir -p /root/.lightning/start9
touch /root/.lightning/start9/restore.yaml