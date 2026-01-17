self.addEventListener("install", e=>{
 e.waitUntil(
  caches.open("tracker").then(c=>
   c.addAll([
    "/",
    "/index.html",
    "/app.js",
    "/style.css"
   ])
  )
 );
});

self.addEventListener("fetch", e=>{
 e.respondWith(
  caches.match(e.request)
   .then(r=> r || fetch(e.request))
 );
});
