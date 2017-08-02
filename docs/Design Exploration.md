# A Different Sort Of GraphQL Cache

This document explores an approach to a normalizing GraphQL cache that addresses some of the [performance problems](./Motivation.md) with existing implementations.


## Goals

There are some hard requirements for the cache that will help inform the design:

1. Clients should be able to read results from the cache with sub-millisecond timings on slow CPU, even for queries that select large numbers of nodes.

2. The cache should be able to integrate (write) new data within a reasonable amount of time on slow CPU (< 100ms), even for payloads that contain large numbers of nodes.

3. Query observers should incur sub-millisecond cost on slow CPU when emitting updated values.  _This is probably resolved as a consequence of (1)._

Note that many of these requirements use a slow CPU (e.g. a mobile phone) as a relative benchmark.  We want to make sure that the cache is useful for mobile apps, not just desktop ones.


## Working Backwards To A Design

Given these requirements, we can begin to narrow in on a specific architecture for the cache.  Or, [skip to the TL;DR if you like](#putting-it-all-together).


### Entities

One interesting observation of the existing implementations is that a fair bit of cost (both in CPU and memory) comes from having to represent object references as pointers in their [normalized (flat) format](./Motivation.md#flattening--normalization).  Additionally, they perform this reference <-> pointer translation for _all_ nodes in the graph.

If that translation can be skipped for some or most of the nodes, there's potential for some large improvements in performance.  A pretty clear strategy for this is to only flatten the nodes that are directly referenced throughout the application.  E.g. anything with an `id` property, under Apollo's default configuration.

In other words, instead of indexing every node in the graph, <u>the cache can index business _entities_</u>.  Entities would be free to contain nested objects (node), where the normalization process becomes a simple object merge, and retrieval requires minimal work (entity references).


### Normalized Graph Cache

Requirements (1) and (3) are interesting: if we _must_ have sub-millisecond reads, that implies that the work performed per read _must_ be minimal.  Constructing a full response from a flat identity map is a non-starter.  Instead, the cache needs to store its state in a format that can either be directly returned, or requires minimal transformation.

Let's say we go all the way: <u>the cache stores values as a literal graph of objects</u>, in the same structure as a GraphQL response.  In order to efficiently normalize that graph, we also ensure that each entity is only represented once.  E.g. entities can be pointed to multiple times, and there is the potential for a cyclic graph, depending on the schema.

Using [the example]((./Motivation.md#flattening--normalization)) from the motivation doc, the normalized graph cache would look like:

```js
{
  ROOT: {
    posts: [
      {…}, // Reference to <1>
      {…}, // Reference to <2>
    ],
  },
  1: {
    id: 1,
    title: "GraphQL Rocks!",
    author: {…} // Reference to <3>
  },
  2: {
    id: 2,
    title: "GraphQL Rocks!",
    author: {…} // Reference to <3>
  },
  3: {
    id: 3,
    name: 'Gouda',
  },
}
```

With a fully normalized graph, we could potentially return it _directly_ to satisfy simple queries ([parameterized edges are more complicated](#dealing-with-parameterized-edges)).  This would also have an added benefit that there is only ever one instance of a particular entity, even _across queries_.

The downside is that we have to loosen Apollo's contract around query results: It would potentially return a superset of results, rather than those that exactly match a query's selection set.  The trade off is worth it - and likely could be mitigated by type checkers or development-mode runtime checks.


### Dealing With Parameterized Edges

Parameterized edges introduce a challenge for the [normalized graph cache](#cyclic-graph-cache) approach: a single property can have multiple values (based on the parameters given).

For example:

```graphql
type Category {
  id: ID
  name: String
  posts(archived: Boolean): [Post]
}
```

The `posts` edge is associated with a particular category, but also has different values based on the `since` argument.  If the cache only has one copy of each entity, we're in a bit of a bind.  How do we persist all the different versions of `posts` in a way that can be efficiently retrieved at read time?

A way around this is to realize that <u>parameterized edges are a view on top of the entity</u>.  We can efficiently achieve that behavior via object prototypes: Any time a query selects parameterized edges, the result can be a thin view on top of it, where the parameterized results are contained in objects that have a prototype of the underling entity.

To illustrate this, here's a condensed example query:

```graphql
{
  simple: category(id: 1) {
    id
    name
    posts { id title }
  }
  parameterized: category(id: 1) {
    id
    name
    posts(archived: true) { id title }
  }
}
```

And result:

```js
{
  simple: {
    id: 1,
    name: 'GraphQL',
    posts: [
      { id: 4, title: 'Caching Is Hard' },
      { id: 3, title: 'GraphQL Rocks' },
    ],
  },
  parameterized: {
    // This object's prototype is the same object referenced by `simple`,
    // allowing it to inherit the values of `id` and `name`, while providing
    // and overridden value of `posts`:
    posts: [
      { id: 1, title: 'Caching: How Hard Could It Be?' },
    ],
  }
}
```


## Putting It All Together

There are a few key design decisions we've determined:

[The cache indexes entities, rather than every node](#entities): This helps mitigate the cost of complex entities.

[Cached entities are stored in a normalized _graph_, rather than a flat identity map](#normalized-graph-cache): This drastically reduces the amount of work required to read values from the cache, at the cost of queries potentially returning a superset of the requested values.

[Parameterized edges are layered on top of entities with prototypes](#dealing-with-parameterized-edges): This minimizes the cost (memory and CPU) of entities that have multiple (parameterized) values for the same property.

A design is beginning to form!  Up next: we solidify these ideas into an actual [architecture](./Architecture.md).
