# Project Terminology

This project is relatively dense, and juggles several concepts.  Here's a quick glossary to (hopefully) clarify a few things:

**Scalar**: A [primitive value](http://facebook.github.io/graphql/#sec-Scalars), such as a number, string, boolean, etc.

**Node**: A [GraphQL object](http://facebook.github.io/graphql/#sec-Objects). May contain scalar values, or references to other nodes. _The term "node" ends up being clearer than "object" when used throughout this document._

**Entity**: A node that has special meaning in a particular schema; a business object.  May be composed of many nested nodes.  E.g. User, Comment, Post, etc.

**Edge**: A name used to reference the value of a node.

**Selection Set**: [An expression of edges](http://facebook.github.io/graphql/#sec-Selection-Sets) - often nested - describing the paths to all values that should be retrieved by a query.

**Observer**: A construct that watches the cache for a specific query, and emits callbacks whenever the values selected by that query have changed.
