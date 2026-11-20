'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function debounce(fn, ms) { let t; const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; d.flush = (...a) => { clearTimeout(t); return fn(...a); }; return d; }

let toastT;
function toast(msg, ms = 2600) {
  const el = $('#toast'); el.textContent = msg; el.classList.remove('hidden');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.add('hidden'), ms);
}

/* Downscale a picked photo to a JPEG data URL. */
function fileToDataURL(file, maxDim = 1280, q = 0.82) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(r.error);
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const s = Math.min(1, maxDim / Math.max(im.naturalWidth, im.naturalHeight));
        const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', q));
      };
      im.onerror = () => rej(new Error('bad image'));
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}
function shrinkDataURL(src, maxDim = 768) {
  return new Promise((res) => {
    const im = new Image();
    im.onload = () => {
      const s = Math.min(1, maxDim / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.8));
    };
    im.onerror = () => res(null); im.src = src;
  });
}

/* Native bridges (iOS) with browser fallbacks */
const Native = {
  has(n) { return !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers[n]); },
  share(files) {
    if (this.has('share')) { window.webkit.messageHandlers.share.postMessage({ files }); return; }
    files.forEach((f) => {
      const bin = atob(f.data.split(',')[1]); const arr = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([arr], { type: f.mime }));
      a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
    });
  },
};
/* HTTP POST. On iOS it goes through URLSession (no CORS); in a browser it uses fetch. */
async function httpPost(url, headers, body) {
  if (Native.has('net')) {
    const r = await window.webkit.messageHandlers.net.postMessage({ url, headers, body });
    return { status: r.status, text: r.text };
  }
  const r = await fetch(url, { method: 'POST', headers, body });
  return { status: r.status, text: await r.text() };
}
