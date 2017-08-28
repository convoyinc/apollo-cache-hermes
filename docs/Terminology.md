# Project Terminology

This project is relatively dense, and juggles several concepts.  Here's a quick glossary to (hopefully) clarify a few things:

**Scalar**: A [primitive value](http://facebook.github.io/graphql/#sec-Scalars), such as a number, string, boolean, etc.

**Node**: A [GraphQL object](http://facebook.github.io/graphql/#sec-Objects). May contain scalar values, or references to other nodes. _The term "node" ends up being clearer than "object" when used throughout this document._

**Entity**: A node that has special meaning in a particular schema; a business object.  May be composed of many nested nodes.  E.g. User, Comment, Post, etc. User can define how to determine entity by providing function `entityIdForNode` as part of cache configuration. Enity can be transformed before returning to user by providing function `entityTransformer` as part of cache configuration.

**Field**: [A name used to reference the value of a node](http://facebook.github.io/graphql/#sec-Language.Fields).

**Parameterized Field**: [A field that includes parameters](http://facebook.github.io/graphql/#sec-Object-Field-Arguments) (that the values are a function of).

**Parameterized Value**: The value referenced by a specific instance of a parameterized field.

**Static Value**: A value of some field within an entity, where that field is _not_ parameterized.

**Selection Set**: [An expression of fields](http://facebook.github.io/graphql/#sec-Selection-Sets) - often nested - describing the paths to all values that should be retrieved by a query.

**Identity Map**: A lookup table mapping identities to a value associated with it.  E.g. userId -> User, etc.

**Observer**: A construct that watches the cache for a specific query, and emits callbacks whenever the values selected by that query have changed.
