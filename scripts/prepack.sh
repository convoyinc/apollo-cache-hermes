#!/usr/bin/env bash
set -e

source ./scripts/include/node.sh

# When installing directly from a git checkout, we get the source, but none of
# the compiled JavaScript.
if [[ ! -d ./node_modules/typescript ]]; then NEEDS_DEV_DEPS=yes; fi

if [[ "${NEEDS_DEV_DEPS}" == "yes" && -d ./node_modules ]]; then
  mv ./node_modules ./node_modules.temp
  echo "Fetching devDependencies so TypeScript sources can be compiled…"
  ${RUNNER} install
fi

run clean
run compile

if [[ "${NEEDS_DEV_DEPS}" == "yes" ]]; then
  rm -rf node_modules
  if [[ -d ./node_modules.temp ]]; then
    mv ./node_modules.temp ./node_modules
  fi
fi
