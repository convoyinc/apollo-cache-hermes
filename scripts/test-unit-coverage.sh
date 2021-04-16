#!/usr/bin/env bash
set -e

source ./scripts/include/node.sh

OPTIONS=()
if [[ "${CI}" == "" ]]; then
  OPTIONS+=(
    --coverageReporters=html
  )
fi

run test-unit -- --coverage "${OPTIONS[@]}"
