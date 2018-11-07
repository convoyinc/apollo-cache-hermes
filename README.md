# Hermes: A Cache For Apollo Client

[![npm](https://img.shields.io/npm/v/apollo-cache-hermes.svg)](https://www.npmjs.com/package/apollo-cache-hermes)
[![Build Status](https://img.shields.io/circleci/project/github/convoyinc/apollo-cache-hermes/master.svg)](https://circleci.com/gh/convoyinc/workflows/apollo-cache-hermes)
[![Code Coverage](https://img.shields.io/codecov/c/github/convoyinc/apollo-cache-hermes.svg)](https://codecov.io/gh/convoyinc/apollo-cache-hermes)

An **experimental** cache implementation for Apollo Client, tuned for the performance of heavy GraphQL payloads.  

_This is very much a work in progress!_ It currently meets most of our needs internally, but is not yet a drop-in replacement for Apollo's default in memory cache.  See [the roadmap](https://github.com/convoyinc/apollo-cache-hermes/projects/2) to get a sense of the work that's left.

## What Makes It Different?

This cache maintains an immutable & normalized _graph_ of the values received from your GraphQL server.  It enables the cache to return _direct references_ to the cache, in order to satisfy queries<sup>1</sup>.  As a result, reads from the cache require minimal work (and can be optimized to constant time lookups in some cases).  The tradeoff is that rather than receiving only the fields selected by a GraphQL query, there may be additional fields.

This is in contrast to the built in cache for Apollo (and Relay), which maintain a normalized _map_ of values.  The unfortunate reality of those caches is that read operations impose _considerable_ overhead (in CPU and memory) in order to build a result payload.  See [the motivation behind this cache](https://github.com/convoyinc/apollo-cache-hermes/blob/master/docs/Motivation.md), as well as [the design exploration](https://github.com/convoyinc/apollo-cache-hermes/blob/master/docs/Design%20Exploration.md) for a deeper discussion.

<sup>1</sup> If your query contains parameterized fields, there is some work that the cache has to perform during read, in order to layer those fields on top of the static values within the cache.

## What _Doesn't_ It Do?

Hermes is still early days! Some things it doesn't (yet!) support:

**Union types**: Hermes currently ignores union types and type constraints on fragments. It can just work, but you will likely [run into trouble](https://github.com/convoyinc/apollo-cache-hermes/issues/372) if you are expecting the cache to be able to differentiate stored state based on the node type.

**`writeData`**: Hermes [doesn't yet implement `writeData`](https://github.com/convoyinc/apollo-cache-hermes/issues/333).

None of these are things that Hermes _can't_ support; we just haven't had time to build those out yet. If you're interested in contributing, please feel free to hit us up; we'd love to work together to get them figured out!

## Using The Cache

Not too different from Apollo's in memory cache, but configuration is slightly different.  

```ts
import { ApolloClient } from 'apollo-client';
import { Hermes } from 'apollo-cache-hermes';

const client = new ApolloClient({
  cache: new Hermes({ … }),
  // …
});
```

By default, the cache will consider all nodes with an `id` field to be _entities_ (e.g. normalized nodes in the graph).

For now, please refer to [the source](https://github.com/convoyinc/apollo-cache-hermes/blob/master/src/context/CacheContext.ts#L57-L117) when looking up configuration values - they're likely to change, and new options to be added.

## Contributing

Interested in helping out?  Awesome!  If you've got an [idea or issue](https://github.com/convoyinc/apollo-cache-hermes/issues), please feel free to file it, and provide as much context as you can.

### Local Development

If you're looking to contribute some code, it's pretty snappy to start development on this repository:

```sh
git clone https://github.com/convoyinc/apollo-cache-hermes
cd apollo-cache-hermes
yarn

# Leave this running while you're working on code — you'll receive immediate
# feedback on compile and test results for the files you're touching.
yarn dev
```
