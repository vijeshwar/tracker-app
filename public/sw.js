self.addEventListener("install",e=>{
 e.waitUntil(caches.open("t")
  .then(c=>c.addAll(["/"])));
});
