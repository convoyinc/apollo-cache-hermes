#!/usr/bin/env bash

(( __NODE_INCLUDED__ )) && return
__NODE_INCLUDED__=1

if [[ "${npm_config_user_agent}" =~ yarn/ ]]; then
  export RUNNER=yarn
else
  export RUNNER=npm
fi

export PATH=$(${RUNNER} bin):$PATH

# Runs a package.json script
run() {
  ${RUNNER} run "${@}"
}
