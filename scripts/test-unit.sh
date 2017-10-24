#!/usr/bin/env bash
set -e

source ./scripts/include/shell.sh
source ./scripts/include/node.sh

FILES=("${OPTIONS_ARGS[@]}")
if [[ "${#FILES[@]}" == "0" ]]; then
  FILES+=($(
    find ./test/unit \
      \( -name "*.ts" -not -name "*.d.ts" \) \
      -or -name "*.tsx"
  ))
fi

# We take ts files as arguments for everyone's sanity; but redirect to their
# compiled sources under the covers.
for i in "${!FILES[@]}"; do
  file="${FILES[$i]}"
  if [[ "${file##*.}" == "ts" ]]; then
    FILES[$i]="${file%.*}.js"
  fi
done

OPTIONS=(
  --maxWorkers=2 --config ./test/unit/jest.json
)
# Jest doesn't handle debugger flags directly.
NODE_OPTIONS=()
for option in "${OPTIONS_FLAGS[@]}"; do
  if [[ "${option}" =~ ^--(inspect|debug-brk|nolazy) ]]; then
    NODE_OPTIONS+=("${option}")
  else
    OPTIONS+=("${option}")
  fi
done

# For jest-junit
export JEST_SUITE_NAME="test-unit"
export JEST_JUNIT_OUTPUT=./output/test-unit/report.xml

node "${NODE_OPTIONS[@]}" ./node_modules/.bin/jest "${OPTIONS[@]}" "${FILES[@]}"
