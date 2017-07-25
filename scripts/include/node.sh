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

# Writes a value to the project's package.json
write_package_key() {
  local KEY="${1}"
  local VALUE="${2}"

  node <<-end_script
    const fs = require('fs');

    const packageInfo = JSON.parse(fs.readFileSync('package.json'));
    packageInfo['${KEY}'] = '${VALUE}';
    fs.writeFileSync('package.json', JSON.stringify(packageInfo, null, 2));
end_script
}
