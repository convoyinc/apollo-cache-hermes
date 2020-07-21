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
  --coverage
  --config ./test/unit/jest.json
)
DEBUGGING=false

# Jest doesn't handle debugger flags directly.
NODE_OPTIONS=()
for option in "${OPTIONS_FLAGS[@]}"; do
  if [[ "${option}" =~ ^--(inspect|debug-brk) ]]; then
    DEBUGGING=true
    NODE_OPTIONS+=("${option}")
  elif [[ "${option}" =~ ^--(nolazy) ]]; then
    NODE_OPTIONS+=("${option}")
  else
    OPTIONS+=("${option}")
  fi
done

# --runInBand and --maxWorkers can't work together
# only set --maxWorkers if we are not debugging and vice versa
if [ "$DEBUGGING" == false ]; then
  OPTIONS+=("--maxWorkers=2")
fi

# For jest-junit
export JEST_SUITE_NAME="test-unit"
export JEST_JUNIT_SUITE_NAME="{filepath}"
export JEST_JUNIT_CLASSNAME="{classname}"
export JEST_JUNIT_TITLE="{title}"
export JEST_JUNIT_ANCESTOR_SEPARATOR=" ▸ "
export JEST_JUNIT_OUTPUT=./output/test-unit/report.xml

node "${NODE_OPTIONS[@]}" ./node_modules/.bin/jest "${OPTIONS[@]}" "${FILES[@]}"

if [[ -z "${CI}" ]]; then
  echo To see coverage info, use 'open ./coverage/index.html'
else
  convoy-coveralls --file=output/test-unit/lcov.info --token="${CODECOV_UPLOAD_TOKEN:?}" --flags=unit
fi