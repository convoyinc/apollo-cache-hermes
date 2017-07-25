#!/usr/bin/env bash
set -e

source ./scripts/include/node.sh

parse_version() {
  version="${1}"
  node <<-end_script
    const match = '${version}'.match(/(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
    for (var i = 1; i < match.length; i++) {
      if (match[i]) {
        console.log(match[i]);
      }
    }
end_script
}

# Ensure a clean build
run clean
run compile

# Make sure we have all tags available
git fetch origin --tags

VERSION_TEMPLATE=$(node -p "JSON.parse(fs.readFileSync('package.json')).version")
CLOSEST_VERSION=$(git describe --abbrev=0 --tags)
TEMPLATE_PARTS=($(parse_version "${VERSION_TEMPLATE}"))
CLOSEST_PARTS=($(parse_version "${CLOSEST_VERSION}"))
echo "template: ${TEMPLATE_PARTS[@]}"
echo "closest: ${CLOSEST_PARTS[@]}"

X="${TEMPLATE_PARTS[0]}"
Y="${TEMPLATE_PARTS[1]}"
if [[ "${TEMPLATE_PARTS[0]}" == "${CLOSEST_PARTS[0]}" && "${TEMPLATE_PARTS[1]}" == "${CLOSEST_PARTS[1]}" ]]; then
  # No change in X.Y - just increment.
  Z=$((CLOSEST_PARTS[2] + 1))
else
  Z="${TEMPLATE_PARTS[2]}"
fi

NEW_VERSION="${X}.${Y}.${Z}"
PRE="${TEMPLATE_PARTS[3]}"
if [[ "${PRE}" != "" ]]; then
  NEW_VERSION="${NEW_VERSION}-${PRE}"
fi

echo "Releasing ${NEW_VERSION}…"
write_package_key version "${NEW_VERSION}"

npm publish

git tag v${NEW_VERSION} -m "${CIRCLE_BUILD_URL}"
git push --tags
git reset --hard HEAD\^
