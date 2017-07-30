# Architecture Of This Cache

This document discusses the specific components of the cache, and roughly how they behave/interact.  You may also want some additional background on the [motivation](./Motivation.md) behind the cache, as well as [the rationale](./Design Exploration.md) for some of the design choices.


## Design Requirements & Decisions

Contracts that we must adhere to:

1. All nodes are normalized in the cache.  _This supports Apollo's existing, and desirable, normalization behavior_

2. Objects returned from query must not be mutated by the cache.  _This allows downstream components to reason clearly about the values they're given from Apollo, and avoid excessive integrity checks._

Design points:

3. [The cache indexes entities](./Design Exploration.md#entities)

4. [Cached entities directly (potentially circularly) reference other cached entities](./Design Exploration.md#normalized-graph-cache)

5. [Values from parameterized edges are layered on top of entities via prototypes](./Design Exploration.md#dealing-with-parameterized-edges)

6. [Entities from the cache are _directly_ returned](./Design Exploration.md#normalized-graph-cache) where possible (no parameterized edges).  _This minimizes the amount of work required when reading from the cache._

7. The cache will garbage collect orphaned entities, as well as provide a mechanism to directly evict entities (and any orphaned by that eviction).


## Snapshots

At its core, the cache maintains a normalized graph of entities, and indexes into that graph for efficient retrieval.  Additionally, due to requirement (2) and design decision (6), this normalized graph must be _immutable_.

To maintain this, the cache tracks the current version of an entity (and the overall graph) via snapshots.  _Note: this is similar, but not identical, to [Relay Modern's concept of snapshots](https://github.com/facebook/relay/blob/master/packages/relay-runtime/ARCHITECTURE.md#example-data-flow-reading-and-observing-the-store)._


### Entity Snapshots

TODO: Rename entity to value!

The cache maintains an [`EntitySnapshot`](../src/EntitySnapshot.ts) for each entity in the graph.  This snapshot maintains a reference to that value (in the normalized graph), as well as additional metadata required to support the various features of the cache:

**Root**: Some entities (such as the [query or mutation roots](http://facebook.github.io/graphql/#sec-Type-System)) are considered to be entry points to the graph.  They, and all the entities they transitively reference, are considered active and will not be garbage collected.

**Inbound references**: Each entity snapshot maintains a list of all _inbound_ references to that entity.  This supports several behaviors:

* Minimal updates when generating a new (immutable) graph snapshot: for each modified entity, all entities that transitively reference it must also be re-created.  By tracking inbound references, we can scope to only those entities, not the entire graph.

* Garbage collection: orphaned entities can be trivially detected (e.g. no inbound references) and removed.

There are several types of entities tracked by entity snapshots, each with a specialized form of the snapshot:

[**Entities**](../src/EntitySnapshot.ts#L40-66]: Tracks an object modeling one of the application's domains.

[**Parameterized Values**](../src/EntitySnapshot.ts#L68-99]: Tracks the value of a parameterized edge, the entity it occurs within, and the path to the edge.  These are used at query time to layer the value of a parameterized edge on top of the underlying entity.


### Graph Snapshots

All entity snapshots referencing a particular version of the graph are collected into an identity map - a [`GraphSnapshot`](../src/GraphSnapshot.ts).  This becomes a readonly view of all the values, as well as the primary entry point into the cache.

It contains entity snapshots for all of the domain entities for the application, as well as some specialized snapshots for queries and other roots.


### Snapshot Transactions

As snapshots maintain a readonly immutable view into a version of the graph, we need a way to generate new versions.  A [`GraphTransaction`](../src/GraphTransaction.ts) encapsulates the logic for making edits to a snapshot in an immutable way (e.g. creating a new copy), following the builder pattern.


#### Merging New Values

The logic for merging new values should be careful to apply the minimal set of edits to the parent snapshot in order to reach the new desired state.  This is in an effort to speed up cache writes, as well as ensuring that object identities only change when their values (or referenced nodes) have changed.

At a high level, this looks something like:

1. Merge all changed scalar values from the payload, generating new node snapshots along the way.

2. Update any references that should now point to a new node (now that all nodes with changed values have been built).

3. Update any nodes that _transitively_ reference edited nodes.

4. Garbage collect any newly orphaned subgraphs.

See [`GraphTransaction#mergePayload`](../src/GraphTransaction.ts) for the specific implementation details.


#### Rolling Back Past Transactions

In order to perform a

In c`EntitySnapshot`s maintain