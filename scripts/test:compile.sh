
#!/usr/bin/env bash
set -e

source ./scripts/include/node.sh
source ./scripts/include/shell.sh

tsc --noEmit "${OPTIONS_FLAGS[@]}" "${OPTIONS_ARGS[@]}"
