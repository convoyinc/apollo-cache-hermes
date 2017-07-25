#!/usr/bin/env bash
set -e

source ./scripts/include/node.sh

# When installing directly from GitHub, we get the source, but none of the
# compiled JavaScript.
if [[ -f ./src/index.js || -d ./node_modules/typescript ]]; then exit 0; fi

# Install our dev dependencies (aka TypeScript) into a sandbox, so that we can
# compile our code.
if [[ -d ./node_modules ]]; then
  mv ./node_modules ./node_modules.temp
fi

echo "Compiling TypeScript sources… "
${RUNNER} install
run prepare # npm v3 and below don't support prepare.

rm -rf node_modules
if [[ -d ./node_modules.temp ]]; then
  mv ./node_modules.temp ./node_modules
fi
