#!/usr/bin/env bash
set -e

source ./scripts/include/node.sh

run test:style -- --fix
