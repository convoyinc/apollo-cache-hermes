#!/usr/bin/env bash
set -e

source ./scripts/include/shell.sh
source ./scripts/include/node.sh

run compile
run test-style "${OPTIONS_ARGS[@]}"
run test-unit "${OPTIONS_ARGS[@]}"
