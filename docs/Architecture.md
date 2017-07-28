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


## Snapshots

At its core, the cache maintains a normalized graph of entities, and indexes them for efficient retrieval.  Additionally, due to requirement (2) and design decision (6), this normalized graph must be _immutable_.

To maintain this, the cache tracks each version of an entity (and the overall graph) via snapshots.  _Note: this is similar, but not identical, to [Relay Modern's concept of snapshots](https://github.com/facebook/relay/blob/master/packages/relay-runtime/ARCHITECTURE.md#example-data-flow-reading-and-observing-the-store)._


### Entity Snapshots

The cache maintains metadata and a pointer to each entity in the cached graph via [`EntitySnapshot`s](../src/EntitySnapshot.ts).

Of particular note, each entity snapshot maintains a list of all _inbound_ references to that entity.  This supports several behaviors:

* Minimal updates when generating a new (immutable) graph snapshot: for each modified entity, all entities that transitively reference it must also be re-created.  By tracking inbound references, we can scope to only those entities, not the entire graph.

* Garbage collection: orphaned entities can be trivially detected (no inbound references) and removed.


### Graph Snapshots
