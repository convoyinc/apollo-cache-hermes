# Architecture Of This Cache

This document discusses the specific components of the cache, and roughly how they behave/interact.  You may also want some additional background on the [motivation](./Motivation.md) behind the cache, as well as [the rationale](./Design Exploration.md) for some of the design choices.


## Design Requirements & Decisions

Contracts that we must adhere to:

1. All nodes are normalized in the cache.  _This supports Apollo's existing, and desirable, normalization behavior_

2. Objects returned from query must not be mutated by the cache.  _This allows downstream components to reason clearly about the values they're given from Apollo, and avoid excessive integrity checks._

Design points:

3. [The cache indexes entities](./Design%20Exploration.md#entities)

4. Cached entities directly (potentially circularly) [reference other cached entities](./Design%20Exploration.md#normalized-graph-cache)

5. Values from parameterized fields are [layered on top of entities via prototypes](./Design%20Exploration.md#dealing-with-parameterized-fields)

6. [Entities from the cache are _directly_ returned](./Design%20Exploration.md#normalized-graph-cache) where possible (no parameterized fields).  _This minimizes the amount of work required when reading from the cache._

7. The cache will garbage collect orphaned entities, as well as provide a mechanism to directly evict entities (and any orphaned by that eviction).


## Snapshots

At its core, the cache maintains a normalized graph of entities, and indexes into that graph for efficient retrieval.  Additionally, due to requirement (2) and design decision (6), this normalized graph must be _immutable_.

To maintain this, the cache tracks the current version of a node (and the overall graph) via snapshots.  _Note: this is similar, but not identical, to [Relay Modern's concept of snapshots](https://github.com/facebook/relay/blob/master/packages/relay-runtime/ARCHITECTURE.md#example-data-flow-reading-and-observing-the-store)._


### Node Snapshots

The cache maintains an [`NodeSnapshot`](../src/NodeSnapshot.ts) for _important_ nodes in the graph - unlike the existing implementations, it does not maintain metadata for a node, unless its necessary.  This snapshot maintains a reference to that node (in the normalized graph), and some metadata.


#### Snapshot Metadata

In addition to the node reference, all node snapshots maintain base metadata:

**Root**: Some entities (such as the [query or mutation roots](http://facebook.github.io/graphql/#sec-Type-System)) are considered to be entry points to the graph.  They, and all the entities they transitively reference, are considered active and will not be garbage collected.

**Inbound references**: Each node snapshot maintains a list of all _inbound_ references to that node.  This allows us to only (shallow) copy the minimal set of nodes when making edits to the graph, due to the immutability constraint.

**Outbound references**: Similarly, each snapshot also maintains a list of all
outbound references, in order to support reference-counted garbage collection.


#### Snapshot Types

There are several types of entities tracked by node snapshots, each with a specialized form of the snapshot:

[**Entities**](../src/NodeSnapshot.ts#L38-L69): Tracks an object modeling one of the application's domains.

[**Parameterized Values**](../src/NodeSnapshot.ts#L71-L111): Tracks the value of a parameterized field, the node it occurs within, and the path to the field.  These are used at query time to layer the value of a parameterized field on top of the underlying node.


### Graph Snapshots

All node snapshots referencing a particular version of the graph are collected into an identity map - a [`GraphSnapshot`](../src/GraphSnapshot.ts).  This becomes a readonly view of all the nodes, as well as the primary entry point into the cache.


### Reading From The Cache

Because the cache is built to store values in a format that can be directly returned (for un-parameterized fields), most of the work to perform a query revolves around making sure that the cache can satisfy the query.  The high level approach to performing a query is roughly:

1. Pre-process the query (if not already done), extracting paths to parameterized fields.

2. If there are parameterized fields in the query, fill in the object path up to them, taking advantage of object prototypes to point to the underlying nodes.

3. Verify that the query is satisfied by the cache.  _The naive approach is to walk the selection set(s) expressed by the query; it's probably good enough for now_.

4. Return the query root, or view on top of it via (2).

Generally, when reading, we want to return whatever data we have, as well as a status indicating whether the query was completely satisfied.  The caller can determine what to do if not satisfied.

See [`operations/read`](../src/operations/read.ts) for specific implementation details.

Note: this is likely the area of the cache with the most room for improvement.  Step (3) has multiple opportunities for memoization and precomputation (per-query, per-fragment, per-node, etc).


### Writing To The Cache

As snapshots maintain a readonly immutable view into a version of the graph, we need a way to generate new versions.  A [`SnapshotEditor`](../src/operations/SnapshotEditor.ts) encapsulates the logic for making edits to a snapshot in an immutable way (e.g. creating a new copy), following the builder pattern.

The logic for merging new values should be careful to apply the minimal set of edits to the parent snapshot in order to reach the new desired state.  This is in an effort to speed up cache writes, as well as ensuring that object identities only change when their values (or referenced nodes) have changed.

At a high level, this looks something like:

1. Merge all changed scalar values from the payload, generating new node snapshots along the way.

2. Update any references that should now point to a new node (now that all nodes with changed values have been built).

3. Update any nodes that _transitively_ reference edited nodes.

4. Garbage collect any newly orphaned subgraphs.

See [`SnapshotEditor#mergePayload`](../src/operations/SnapshotEditor.ts) for the specific implementation details.


### Optimistic Updates

Optimistic updates are tricky.  Mutations can specify an optimistic response, to be applied immediately on top of the existing state of the cache.  There are some interesting rules surrounding them:

1. There can be any number of optimistic updates active at a time, and the values from more recent ones take precedence.

2. Any optimistic update can be reverted at any time (but typically when the mutation completes, success or error) - the rest must continue to overlay the underlying state of the cache.

3. The data expressed by the optimistic update MUST take precedence over the base cache, even if we've gotten newer values from the server.

4. When querying the cache for values, it should prefer values present in optimistic updates over those in the underlying cache.

Due to (2) and (3), we know that we cannot blindly merge optimistic updates into an existing snapshot - and that we must track the base cache snapshot.  Also, due to (3), whenever we receive new values from the server, we effectively need to update the raw cache snapshot, and then replay optimistic updates.

The approach that seems best here is to:

* Track all optimistic updates individually via an [optimistic state queue](../src/OptimisticUpdateQueue.ts), where each update is represented in the same format as a GraphQL response payload.

* The cache tracks both a base graph snapshot and - if there are active optimistic updates - an optimistic graph snapshot.  Every time either the raw snapshot changes, or the optimistic state queue changes, we regenerate the unified snapshot by replaying the optimistic updates on top of the base snapshot.

One future improvement is to merge optimistic updates where possible, so that we have fewer updates to apply on each write.
