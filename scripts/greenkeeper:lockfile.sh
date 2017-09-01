#!/usr/bin/env bash
set -e

# Don't bother unless this is a Greenkeeper build.
[[ ! "${CIRCLE_BRANCH}" =~ ^greenkeeper/ ]] && exit 0

# We must run this _before_ we yarn install.
yarn global add greenkeeper-lockfile

greenkeeper-lockfile-update
greenkeeper-lockfile-upload
