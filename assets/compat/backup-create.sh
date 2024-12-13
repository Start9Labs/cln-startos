#!/bin/sh

touch /root/.lightning/.backupignore
echo "/root/.lightning/bitcoin/lightningd.sqlite3" > /root/.lightning/.backupignore
compat duplicity create /mnt/backup /root/.lightning