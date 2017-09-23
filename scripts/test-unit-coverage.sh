#!/usr/bin/env bash
set -e

source ./scripts/include/node.sh

OPTIONS=()
if [[ "${CI}" == "" ]]; then
  OPTIONS+=(
    --coverageReporters html
  )
fi

run test:unit --coverage "${OPTIONS[@]}"

if [[ "${CI}" == "" ]]; then
  open ./output/test:unit/index.html
else
  codecov --file=./output/test:unit/lcov.info
fi
