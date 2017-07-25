#!/usr/bin/env bash
set -e

source ./scripts/include/node.sh

greenkeeper-lockfile-update
greenkeeper-lockfile-upload
