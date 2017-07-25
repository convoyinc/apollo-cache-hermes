#!/usr/bin/env bash
set -e

source ./scripts/include/node.sh

VERSION_PARTS=($(node <<-end_script
  const fs = require('fs');
  const version = JSON.parse(fs.readFileSync('package.json')).version;
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  for (var i = 1; i < match.length; i++) {
    if (match[i]) {
      console.log(match[i]);
    }
  }
end_script
))

X="${VERSION_PARTS[0]}"
Y="${VERSION_PARTS[1]}"
Z="${VERSION_PARTS[2]}"
PRE="${VERSION_PARTS[3]}"

NEW_VERSION="${X}.${Y}.${CIRCLE_BUILD_NUM}"
if [[ "${PRE}" != "" ]]; then
  NEW_VERSION="${NEW_VERSION}-${PRE}"
fi

echo "Releasing ${NEW_VERSION}…"
write_package_key version "${NEW_VERSION}"

npm publish

git add .
git commit -m "${CIRCLE_BUILD_URL}"
git tag v${NEW_VERSION} -m "${CIRCLE_BUILD_URL}"
git push --tags
git reset --hard HEAD\^
