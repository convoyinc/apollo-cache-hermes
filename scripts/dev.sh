#!/usr/bin/env bash
set -e

source ./scripts/include/node.sh

# Kill all child processes on exit.
trap 'trap - SIGTERM && kill 0' SIGINT SIGTERM EXIT

# Compile TypeScript sources in the background; but wait for it to have
# completed the first compile run before passing control off to Jest.

tsc_fifo=$(mktemp -u)
mkfifo "${tsc_fifo}"

run compile -- --watch >"${tsc_fifo}" 2>&1 &
while read -r line; do
  echo "${line}"
  if [[ "${line}" =~ "Compilation complete" ]]; then
    break
  fi
done <"${tsc_fifo}"
# Finally, redirect tsc back to stdout
cat "${tsc_fifo}" >&1 &

# Let jest own our process & stdin.
run test-unit -- --watch --notify
