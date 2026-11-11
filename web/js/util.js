'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const clone = (o) => JSON.parse(JSON.stringify(o));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function icon(name, size = 22) {
  const p = (window.ICONS && ICONS[name]) || '';
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}
function iconSrc(name, color = '#1F2A44', sw = 2) {
  const p = (ICONS[name] || '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="480" height="480" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function debounce(fn, ms) {
  let t; const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.flush = (...a) => { clearTimeout(t); return fn(...a); };
  return d;
}

let toastT;
function toast(msg, ms = 2200) {
  const el = $('#toast'); el.textContent = msg; el.classList.remove('hidden');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.add('hidden'), ms);
}

const imgCache = new Map();
function loadImage(src) {
  if (imgCache.has(src)) return imgCache.get(src);
  const p = new Promise((res) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = src;
  });
  imgCache.set(src, p);
  return p;
}
const imgReady = new Map(); // src -> HTMLImageElement (sync access after preload)
async function preloadSrc(src) {
  if (!src || imgReady.has(src)) return imgReady.get(src);
  const im = await loadImage(src); if (im) imgReady.set(src, im); return im;
}

function fileToDataURL(file, maxDim = 2400) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(r.error);
    r.onload = async () => {
      const im = await loadImage(r.result);
      if (!im) return rej(new Error('bad image'));
      const s = Math.min(1, maxDim / Math.max(im.naturalWidth, im.naturalHeight));
      const w = Math.round(im.naturalWidth * s), h = Math.round(im.naturalHeight * s);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(im, 0, 0, w, h);
      const png = /png|webp|gif|svg/.test(file.type);
      imgCache.delete(r.result);
      res({ src: c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.9), w, h });
    };
    r.readAsDataURL(file);
  });
}

const RTL_RE = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
const LTR_RE = /[A-Za-zÀ-ɏ]/;
function textDir(t) {
  for (const ch of String(t || '')) { if (RTL_RE.test(ch)) return 'rtl'; if (LTR_RE.test(ch)) return 'ltr'; }
  return document.documentElement.dir || 'ltr';
}

/* Native bridge (iOS WKWebView) with browser fallbacks */
const Native = {
  has(n) { return !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers[n]); },
  share(files) {
    if (this.has('share')) { window.webkit.messageHandlers.share.postMessage({ files }); return; }
    files.forEach((f, i) => setTimeout(() => {
      const [head, b64] = f.data.split(','); const bin = atob(b64); const arr = new Uint8Array(bin.length);
      for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
      const url = URL.createObjectURL(new Blob([arr], { type: f.mime || head.slice(5).split(';')[0] }));
      const a = document.createElement('a'); a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, i * 300));
  },
};
