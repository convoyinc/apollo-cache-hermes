# Hermes: A Cache For Apollo Client

[![npm](https://img.shields.io/npm/v/apollo-cache-hermes.svg)](https://www.npmjs.com/package/apollo-cache-hermes)
[![Build Status](https://img.shields.io/circleci/project/github/convoyinc/apollo-cache-hermes/master.svg)](https://circleci.com/gh/convoyinc/workflows/apollo-cache-hermes)
[![Code Coverage](https://img.shields.io/codecov/c/github/convoyinc/apollo-cache-hermes.svg)](https://codecov.io/gh/convoyinc/apollo-cache-hermes)

A cache implementation for Apollo Client, tuned for performance.

## Contributing

Interested in helping out?  Awesome!  If you've got an [idea or issue](https://github.com/convoyinc/apollo-cache-hermes/issues), please feel free to file it, and provide as much context as you can.

### Local Development

If you're looking to contribute some code, it's pretty snappy to start development on this repository:

```sh
git clone https://github.com/convoyinc/apollo-cache-hermes
cd apollo-cache-hermes
npm install

# Leave this running while you're working on code — you'll receive immediate
# feedback on compile and test results for the files you're touching.
npm run dev
```

### Forks

This repo is fork- and git-friendly!

```json
"apollo-cache-hermes": "convoyinc/apollo-cache-hermes#master"
```

If you depend on a specific git branch or commit, the package [will compile itself](scripts/postinstall.sh) during install.  This makes it easy to test out pull requests before they're merged into `master`.
