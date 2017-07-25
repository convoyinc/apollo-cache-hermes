#!/usr/bin/env bash
set -e

source ./scripts/include/node.sh

run test:unit -- --coverage

if [[ "${CI}" != "" ]]; then
  codecov --file=./output/test:unit/lcov.info
fi
