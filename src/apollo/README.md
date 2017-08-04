# Wait, What

Wait, isn't this an Apollo-centric repo?  Why the separation of Apollo-isms!?

For a couple reasons:

* Apollo's Cache API is still under a bit of flux, and we'd like to isolate ourselves against it as much as possible.

* Similarly, there are portions of the Cache API that do not apply cleanly to this style of cache.  Having an interface translation layer helps separate those concerns better.

* We may, some day, wish to open this cache up for use in other clients, too.
