#!/usr/bin/env bash
set -e

# We must run this _before_ we yarn install.
yarn global add greenkeeper-lockfile

greenkeeper-lockfile-update
greenkeeper-lockfile-upload
