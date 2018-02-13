#!/usr/bin/env bash
set -e

# If there are already node_modules, we can stop here.  We expect that our CI
# build process restores them only when package.json has not changed.
[[ -d ./node_modules ]] && exit 0

# Finally, install.
yarn install
