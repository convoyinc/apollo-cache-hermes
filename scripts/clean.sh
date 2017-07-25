#!/usr/bin/env bash
set -e

FILES_TO_REMOVE=($(find src -name "*.d.ts" -or -name "*.js" -or -name "*.js.map"))

if [[ "${#FILES_TO_REMOVE[@]}" != "0" ]]; then
  echo
  for file in "${FILES_TO_REMOVE[@]}"; do
    echo "  ${file}"
    rm "${file}"
  done
  echo
fi
