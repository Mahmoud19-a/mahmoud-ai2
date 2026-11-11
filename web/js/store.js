'use strict';
/* Key-value storage. On iOS it goes to files in the app's Documents folder
   through the native "store" bridge; in a browser it uses IndexedDB. */
const Store = (() => {
  const native = Native.has('store');
  const call = (m) => window.webkit.messageHandlers.store.postMessage(m);
  let dbp;
  const idb = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('lawha', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = async (mode, fn) => {
    const db = await idb();
    return new Promise((res, rej) => {
      const t = db.transaction('kv', mode); const req = fn(t.objectStore('kv'));
      t.oncomplete = () => res(req && req.result); t.onerror = () => rej(t.error);
    });
  };
  return {
    async get(k, def = null) {
      try {
        const v = native ? await call({ op: 'get', key: k }) : await tx('readonly', (s) => s.get(k));
        return v == null ? def : JSON.parse(v);
      } catch (e) { console.error(e); return def; }
    },
    async set(k, v) {
      const s = JSON.stringify(v);
      return native ? call({ op: 'set', key: k, value: s }) : tx('readwrite', (st) => st.put(s, k));
    },
    async del(k) { return native ? call({ op: 'del', key: k }) : tx('readwrite', (s) => s.delete(k)); },
  };
})();
