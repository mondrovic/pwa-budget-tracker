const FILES_TO_CACHE = [
  "./index.html",
  "./js/index.js",
  "./js/idb.js",
  "./css/styles.css",
];

const APP_PREFIX = "Budget";
const VERSION = "v_01";
const CACHE_NAME = APP_PREFIX + VERSION;

// install service worker
self.addEventListener("install", function (event) {
  // waitUntil() tells the browser that work is ongoing until the promise settle
  // and it shouldn't terminate the service worker if it wants that work to complete.
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log(`Installing cache: ${CACHE_NAME}`);
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

/*
The activate events in service workers use waitUntil() to buffer functional events 
such as fetch and push until the promise passed to waitUntil() settles. 
This gives the service worker time to update database schemas and delete outdated caches, 
so other events can rely on a completely upgraded state.
*/

self.addEventListener("activate", function (event) {
  event.waitUntil(
    // gets all keys from cache
    caches.keys().then(function (keylist) {
      // filters to only give back keys with prefix (github host will pull all github cache with username)
      let cacheKeep = keylist.filter(function (key) {
        return key.indexOf(APP_PREFIX);
      });

      cacheKeep.push(CACHE_NAME);

      return Promise.all(
        keylist.map(function (key, i) {
          if (cacheKeep.indexOf(key) === -1) {
            console.log(`Deleting cache: ${keylist[i]}`);
            return caches.delete(keylist[i]);
          }
        })
      );
    })
  );
});

// fetch cached resources
self.addEventListener("fetch", function (event) {
  console.log(`Fetch request: ${event.request.url}`);
  event.respondWith(
    // cache tries to match event.request
    caches
      .match(event.request)
      .then(function (request) {
        // event.request allows us to match each resource requested from the network with the equivalent
        // resource available in the cache, if there is a matching one available.
        return request || fetch(event.request);
      })
      // if above fails, returns with index.html from cache
      .catch(function (err) {
        return caches.match("index.html");
      })
  );
});
