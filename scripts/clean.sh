#!/usr/bin/env bash
set -e

FILES_TO_REMOVE=($(
  find . \
    \( -name "*.d.ts" -or -name "*.js" -or -name "*.js.map" \) \
    -not -path "./scripts/*" \
    -not -path "./coverage/*" \
    -not -path "./node_modules/*" \
    -not -path "./typings/*"
))

# We also just drop some trees completely.
rm -rf ./output
