#!/usr/bin/env bash
set -e

# If there are already node_modules, we can stop here.  We expect that our CI
# build process restores them only when package.json has not changed.
[[ -d ./node_modules ]] && exit 0

# If this is a Greenkeeper build, make sure to update the lockfile before
# installing dependencies.
if [[ "${CIRCLE_BRANCH}" =~ ^greenkeeper/ ]]; then
  sudo yarn global add greenkeeper-lockfile
  greenkeeper-lockfile-update
  greenkeeper-lockfile-upload
fi

# Finally, install.
yarn install --frozen-lockfile
