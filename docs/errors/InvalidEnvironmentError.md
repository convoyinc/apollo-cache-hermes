# Invalid Environment

Hermes requires some ES2015 features to exist in order for proper operation:

* `Symbol` and `Symbol.iterator`
* `Set`
* `Map`

If you are encountering an `InvalidEnvironmentError`, you are likely running in an environment that lacks those, or has only partially implemented them.

## Suggestions

Thankfully, these features are polyfillable. It's suggested that you depend on [core-js](https://github.com/zloirock/core-js), if you are not already. Then, make sure that you load its polyfills, _before loading hermes_, for the desired functionality:

```ts
import 'core-js/es6/symbol';
import 'core-js/es6/set';
import 'core-js/es6/map';
```
