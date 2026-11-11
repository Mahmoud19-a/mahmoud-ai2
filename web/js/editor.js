'use strict';
/* The canvas editor. The design JSON is the source of truth; Konva nodes are
   rebuilt from it after every change. */

const Ed = {
  design: null, pi: 0, sel: [], zoom: 1, fitted: true, multi: false, clip: null,
  hist: [], hi: 0, pool: new Map(), poolRev: new Map(),
  stage: null, layer: null, world: null, page: null, bg: null, content: null, guides: null, tr: null, marquee: null,
};
const isTouch = matchMedia('(pointer: coarse)').matches;
const curPage = () => Ed.design.pages[Ed.pi];
const findEl = (id) => curPage().elements.find((e) => e.id === id);
const selEls = () => Ed.sel.map(findEl).filter(Boolean);
const nodeOf = (id) => Ed.content.getChildren().find((n) => n.id() === id);

/* ---------- stage setup ---------- */
function initStage() {
  const box = $('#stage');
  Ed.stage = new Konva.Stage({ container: box, width: box.clientWidth || 300, height: box.clientHeight || 300 });
  Ed.layer = new Konva.Layer(); Ed.stage.add(Ed.layer);
  Ed.world = new Konva.Group(); Ed.layer.add(Ed.world);
  Ed.page = new Konva.Rect({ fill: '#fff', shadowColor: 'rgba(31,42,68,.35)', shadowBlur: 18, shadowOffsetY: 3, shadowForStrokeEnabled: false, name: 'page' });
  Ed.bg = new Konva.Group({ listening: false });
  Ed.content = new Konva.Group();
  Ed.guides = new Konva.Group({ listening: false });
  Ed.world.add(Ed.page, Ed.bg, Ed.content, Ed.guides);
  Ed.tr = new Konva.Transformer({
    rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315], rotationSnapTolerance: 6,
    anchorSize: isTouch ? 18 : 11, anchorCornerRadius: 9, anchorStroke: '#E4572E', anchorFill: '#fff', anchorStrokeWidth: 2,
    borderStroke: '#E4572E', borderStrokeWidth: 1.5, rotateAnchorOffset: isTouch ? 34 : 26, padding: 3, ignoreStroke: true, flipEnabled: false,
    boundBoxFunc: (o, n) => (Math.abs(n.width) < 8 || (!Ed.lineSel && Math.abs(n.height) < 8) ? o : n),
  });
  Ed.layer.add(Ed.tr);
  Ed.marquee = new Konva.Rect({ fill: 'rgba(228,87,46,.12)', stroke: '#E4572E', strokeWidth: 1, visible: false, listening: false });
  Ed.layer.add(Ed.marquee);
  new ResizeObserver(() => resizeStage()).observe($('#stageWrap'));
  bindStage();
}
function resizeStage() {
  const box = $('#stageWrap'); if (!Ed.stage || !box.clientWidth) return;
  Ed.stage.size({ width: box.clientWidth, height: box.clientHeight });
  if (Ed.fitted && Ed.design) fit(); else Ed.layer.batchDraw();
}
function fit() {
  const W = Ed.stage.width(), H = Ed.stage.height(), d = Ed.design;
  const side = W < 700 ? 104 : 120;
  const z = Math.max(0.02, Math.min((W - side) / d.width, (H - 128) / d.height));
  Ed.zoom = z; Ed.world.scale({ x: z, y: z });
  Ed.world.position({ x: (W - d.width * z) / 2, y: Math.max(60, (H - 4 - d.height * z) / 2) });
  Ed.fitted = true; afterZoom();
}
function zoomAt(z, cx, cy) {
  z = clamp(z, 0.02, 8);
  const px = (cx - Ed.world.x()) / Ed.zoom, py = (cy - Ed.world.y()) / Ed.zoom;
  Ed.zoom = z; Ed.world.scale({ x: z, y: z }); Ed.world.position({ x: cx - px * z, y: cy - py * z });
  Ed.fitted = false; afterZoom();
}
function afterZoom() {
  $('#zoomLabel').textContent = Math.round(Ed.zoom * 100) + '%';
  Ed.tr.forceUpdate(); Ed.layer.batchDraw();
}

/* ---------- rendering ---------- */
let renderTok = 0;
async function renderPage() {
  const tok = ++renderTok, page = curPage(), d = Ed.design;
  await ensureFonts(page); await preloadPage(page);
  if (tok !== renderTok) return;
  Ed.tr.nodes([]);
  Ed.page.size({ width: d.width, height: d.height });
  Ed.bg.destroyChildren(); bgNodes(page, d.width, d.height).forEach((n) => Ed.bg.add(n));
  Ed.content.destroyChildren(); Ed.content.clip({ x: 0, y: 0, width: d.width, height: d.height });
  page.elements.forEach((el) => Ed.content.add(makeNode(el, true)));
  Ed.sel = Ed.sel.filter((id) => findEl(id));
  syncTr(); Ed.layer.batchDraw();
  updatePagebar(); updateCtx(); updateUndo();
  Panels.onRender();
}

/* ---------- history (images are pooled so snapshots stay small) ---------- */
function snap() {
  const d = Ed.design;
  return JSON.stringify({ width: d.width, height: d.height, pages: d.pages }, (k, v) => {
    if ((k === 'src' || k === 'image') && typeof v === 'string' && v.startsWith('data:')) {
      let id = Ed.poolRev.get(v); if (!id) { id = '@@' + uid(); Ed.pool.set(id, v); Ed.poolRev.set(v, id); } return id;
    }
    return v;
  });
}
function unsnap(s) { return JSON.parse(s, (k, v) => (typeof v === 'string' && v.startsWith('@@') && Ed.pool.has(v) ? Ed.pool.get(v) : v)); }
function commit() {
  const s = snap(); if (s === Ed.hist[Ed.hi]) return;
  Ed.hist = Ed.hist.slice(0, Ed.hi + 1); Ed.hist.push(s);
  if (Ed.hist.length > 80) Ed.hist.shift();
  Ed.hi = Ed.hist.length - 1; saveSoon(); updateUndo();
}
function restore() {
  const o = unsnap(Ed.hist[Ed.hi]), d = Ed.design;
  const sized = o.width !== d.width || o.height !== d.height;
  Object.assign(d, o); Ed.pi = Math.min(Ed.pi, d.pages.length - 1);
  if (sized) fit();
  renderPage(); saveSoon(); Panels.onSelection();
}
function undo() { if (Ed.hi > 0) { Ed.hi--; restore(); } }
function redo() { if (Ed.hi < Ed.hist.length - 1) { Ed.hi++; restore(); } }
function updateUndo() { $('#undoBtn').disabled = Ed.hi <= 0; $('#redoBtn').disabled = Ed.hi >= Ed.hist.length - 1; }

const saveSoon = debounce(saveNow, 700);
async function saveNow() {
  const d = Ed.design; if (!d) return;
  d.updatedAt = Date.now();
  await Store.set('design:' + d.id, d);
  try { d.thumb = await pageThumb(d, d.pages[0]); } catch (e) { /* keep old thumb */ }
  await Home.upsertIndex(d);
}

/* change helper: mutate JSON, re-render, record history */
function change(fn, { history = true } = {}) { fn(); renderPage(); if (history) commit(); }

/* ---------- selection ---------- */
function select(ids) { Ed.sel = ids.slice(); syncTr(); updateCtx(); Panels.onSelection(); }
function syncTr() {
  const els = selEls(), nodes = els.map((e) => nodeOf(e.id)).filter(Boolean);
  const one = els.length === 1 ? els[0] : null;
  Ed.lineSel = !!(one && one.type === 'line');
  let anchors = ['top-left', 'top-right', 'bottom-left', 'bottom-right'], keep = true;
  if (one) {
    if (one.type === 'text') anchors = [...anchors, 'middle-left', 'middle-right'];
    if (one.type === 'line') { anchors = ['middle-left', 'middle-right']; keep = false; }
    if (one.type === 'shape') { anchors = [...anchors, 'top-center', 'bottom-center', 'middle-left', 'middle-right']; keep = false; }
  }
  const locked = els.some((e) => e.locked);
  Ed.tr.setAttrs({ enabledAnchors: locked ? [] : anchors, keepRatio: keep, rotateEnabled: !locked, ignoreStroke: !Ed.lineSel,
    borderDash: locked ? [4, 4] : undefined });
  Ed.tr.nodes(nodes); Ed.tr.moveToTop(); Ed.layer.batchDraw();
}
function topOf(n) {
  for (let x = n; x && x !== Ed.stage; x = x.getParent()) {
    if (x === Ed.tr) return 'tr';
    if (x.getParent() === Ed.content) return x;
  }
  return null;
}

/* ---------- stage events ---------- */
function bindStage() {
  const st = Ed.stage;
  let mq = null, pan = null, pinch = null;
  const pointer = () => st.getPointerPosition() || { x: 0, y: 0 };

  st.on('mousedown touchstart', (e) => {
    if (pinch) return;
    const top = topOf(e.target);
    if (top === 'tr') return;
    if (!top) {
      const p = pointer();
      if (e.evt.type === 'touchstart' && !Ed.multi) { pan = { x: p.x, y: p.y, wx: Ed.world.x(), wy: Ed.world.y(), moved: false }; return; }
      mq = { x: p.x, y: p.y }; Ed.marquee.setAttrs({ x: p.x, y: p.y, width: 0, height: 0, visible: true });
      return;
    }
    const id = top.id(), add = Ed.multi || e.evt.shiftKey;
    if (add) select(Ed.sel.includes(id) ? Ed.sel.filter((x) => x !== id) : [...Ed.sel, id]);
    else if (!Ed.sel.includes(id)) select([id]);
  });
  st.on('mousemove touchmove', (e) => {
    const touches = e.evt.touches;
    if (touches && touches.length === 2) {
      e.evt.preventDefault();
      Ed.content.getChildren().forEach((n) => n.isDragging() && n.stopDrag());
      mq = null; pan = null; Ed.marquee.visible(false);
      const r = st.container().getBoundingClientRect();
      const a = { x: touches[0].clientX - r.left, y: touches[0].clientY - r.top }, b = { x: touches[1].clientX - r.left, y: touches[1].clientY - r.top };
      const dist = Math.hypot(a.x - b.x, a.y - b.y), c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (!pinch) { pinch = { dist, c, z: Ed.zoom, wx: Ed.world.x(), wy: Ed.world.y() }; return; }
      const z = clamp((pinch.z * dist) / pinch.dist, 0.02, 8);
      const px = (pinch.c.x - pinch.wx) / pinch.z, py = (pinch.c.y - pinch.wy) / pinch.z;
      Ed.zoom = z; Ed.world.scale({ x: z, y: z }); Ed.world.position({ x: c.x - px * z, y: c.y - py * z });
      Ed.fitted = false; afterZoom();
      return;
    }
    if (pan) {
      const p = pointer();
      if (Math.abs(p.x - pan.x) + Math.abs(p.y - pan.y) > 4) pan.moved = true;
      if (pan.moved && !Ed.fitted) { Ed.world.position({ x: pan.wx + p.x - pan.x, y: pan.wy + p.y - pan.y }); Ed.layer.batchDraw(); }
      return;
    }
    if (mq) {
      const p = pointer();
      Ed.marquee.setAttrs({ x: Math.min(p.x, mq.x), y: Math.min(p.y, mq.y), width: Math.abs(p.x - mq.x), height: Math.abs(p.y - mq.y) });
      Ed.layer.batchDraw();
    }
  });
  st.on('mouseup touchend touchcancel', (e) => {
    if (e.evt.touches && e.evt.touches.length) return;
    if (pinch) { pinch = null; return; }
    if (pan) { if (!pan.moved) select([]); pan = null; return; }
    if (mq) {
      const box = Ed.marquee.getClientRect(); Ed.marquee.visible(false); mq = null;
      if (box.width < 5 && box.height < 5) { if (!Ed.multi) select([]); }
      else {
        const ids = Ed.content.getChildren().filter((n) => n.visible() && Konva.Util.haveIntersection(box, n.getClientRect())).map((n) => n.id());
        select(e.evt.shiftKey || Ed.multi ? [...new Set([...Ed.sel, ...ids])] : ids);
      }
      Ed.layer.batchDraw();
    }
  });
  st.on('dblclick dbltap', (e) => {
    const top = topOf(e.target); if (!top || top === 'tr') return;
    const el = findEl(top.id()); if (el && el.type === 'text' && !el.locked) Panels.editText(el);
  });
  st.on('wheel', (e) => {
    e.evt.preventDefault();
    if (e.evt.ctrlKey || e.evt.metaKey) { const p = pointer(); zoomAt(Ed.zoom * Math.exp(-e.evt.deltaY * 0.01), p.x, p.y); }
    else { Ed.world.position({ x: Ed.world.x() - e.evt.deltaX, y: Ed.world.y() - e.evt.deltaY }); Ed.fitted = false; Ed.layer.batchDraw(); }
  });

  Ed.content.on('dragstart', (e) => {
    const top = topOf(e.target); if (!top || top === 'tr') return;
    if (!Ed.sel.includes(top.id())) select([top.id()]);
    $('#ctxbar').classList.add('hidden');
  });
  Ed.content.on('dragmove', (e) => { if (Ed.sel.length === 1) snapNode(e.target); });
  Ed.content.on('dragend', () => {
    Ed.guides.destroyChildren();
    selEls().forEach((el) => { const n = nodeOf(el.id); if (n) { el.x = n.x(); el.y = n.y(); } });
    commit(); updateCtx(); Ed.layer.batchDraw();
  });
  Ed.tr.on('transform', () => {
    const a = Ed.tr.getActiveAnchor();
    if (a === 'middle-left' || a === 'middle-right') {
      Ed.tr.nodes().forEach((n) => { if (n.className === 'Text') { n.width(Math.max(20, n.width() * n.scaleX())); n.scaleX(1); } });
    }
  });
  Ed.tr.on('transformend', () => {
    Ed.tr.nodes().forEach((n) => { const el = findEl(n.id()); if (el) bake(n, el); });
    renderPage(); commit();
  });
}
function bake(n, el) {
  el.x = n.x(); el.y = n.y(); el.rotation = n.rotation();
  const sx = Math.abs(n.scaleX()), sy = Math.abs(n.scaleY());
  switch (el.type) {
    case 'text':
      el.w = n.width() * sx;
      if (Math.abs(sy - 1) > 1e-4) { el.fontSize *= sy; if (el.strokeWidth) el.strokeWidth *= sy; if (el.letterSpacing) el.letterSpacing *= sy; }
      break;
    case 'shape': case 'image': case 'icon': el.w *= sx; el.h *= sy; break;
    case 'line': el.w *= sx; break;
    case 'group': if (Math.abs(sx - 1) > 1e-4) el.children.forEach((c) => { c.x *= sx; c.y *= sx; scaleEl(c, sx); }); break;
  }
}

/* snapping guides: page edges/centre and other elements */
function snapNode(n) {
  const d = Ed.design, tol = 7 / Ed.zoom;
  Ed.guides.destroyChildren();
  const box = n.getClientRect({ relativeTo: Ed.content });
  const vs = [0, d.width / 2, d.width], hs = [0, d.height / 2, d.height];
  Ed.content.getChildren().forEach((o) => {
    if (o === n || !o.visible()) return;
    const b = o.getClientRect({ relativeTo: Ed.content });
    vs.push(b.x, b.x + b.width / 2, b.x + b.width); hs.push(b.y, b.y + b.height / 2, b.y + b.height);
  });
  const best = (edges, targets) => {
    let r = null;
    edges.forEach((e) => targets.forEach((t) => { const dd = t - e; if (Math.abs(dd) < tol && (!r || Math.abs(dd) < Math.abs(r.d))) r = { d: dd, t }; }));
    return r;
  };
  const bx = best([box.x, box.x + box.width / 2, box.x + box.width], vs);
  const by = best([box.y, box.y + box.height / 2, box.y + box.height], hs);
  const sw = 1.5 / Ed.zoom, dash = [6 / Ed.zoom, 4 / Ed.zoom];
  if (bx) { n.x(n.x() + bx.d); Ed.guides.add(new Konva.Line({ points: [bx.t, -2000, bx.t, d.height + 2000], stroke: '#E4572E', strokeWidth: sw, dash })); }
  if (by) { n.y(n.y() + by.d); Ed.guides.add(new Konva.Line({ points: [-2000, by.t, d.width + 2000, by.t], stroke: '#E4572E', strokeWidth: sw, dash })); }
}

/* ---------- element operations ---------- */
function estH(el) {
  if (el.type === 'text') return el.fontSize * (el.lineHeight || 1.25) * String(el.text).split('\n').length;
  if (el.type === 'line') return el.strokeWidth;
  if (el.type === 'group') { let mx = 0; el.children.forEach((c) => { mx = Math.max(mx, c.y + estH(c)); }); return mx; }
  return el.h || 0;
}
function estW(el) { if (el.type === 'group') { let mx = 0; el.children.forEach((c) => { mx = Math.max(mx, c.x + estW(c)); }); return mx; } return el.w || 0; }
/* add elements laid out from (0,0); they are centred on the page */
function addEls(els) {
  const d = Ed.design; els = reId(clone(els));
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  els.forEach((e) => { x1 = Math.min(x1, e.x); y1 = Math.min(y1, e.y); x2 = Math.max(x2, e.x + estW(e)); y2 = Math.max(y2, e.y + estH(e)); });
  const dx = d.width / 2 - (x1 + x2) / 2, dy = d.height / 2 - (y1 + y2) / 2;
  els.forEach((e) => { e.x += dx; e.y += dy; e.rotation = e.rotation || 0; });
  const page = curPage();
  if (els.length > 1) { const g = { id: uid(), type: 'group', x: 0, y: 0, rotation: 0, children: els }; page.elements.push(g); Ed.sel = [g.id]; }
  else { page.elements.push(els[0]); Ed.sel = [els[0].id]; }
  change(() => {}); Panels.onSelection();
}
function scaleCombo(els, targetW) {
  const w = Math.max(...els.map((e) => e.x + estW(e))); const s = targetW / w;
  return els.map((e) => { const c = clone(e); c.x *= s; c.y *= s; scaleEl(c, s); return c; });
}

function delSel() { if (!Ed.sel.length) return; const ids = new Set(Ed.sel); change(() => { const p = curPage(); p.elements = p.elements.filter((e) => !ids.has(e.id) || e.locked); }); select([]); }
function dupSel() {
  const els = selEls(); if (!els.length) return;
  const off = Ed.design.width * 0.025, page = curPage(), ids = [];
  change(() => {
    els.forEach((e) => {
      const c = clone(e); reId([c]); c.x += off; c.y += off; c.locked = false;
      page.elements.splice(page.elements.indexOf(e) + 1 + ids.length, 0, c); ids.push(c.id);
    });
  });
  select(ids);
}
function copySel() { const els = selEls(); if (els.length) Ed.clip = clone(els); }
function paste() {
  if (!Ed.clip) return; const off = Ed.design.width * 0.025, page = curPage(), ids = [];
  change(() => Ed.clip.forEach((e) => { const c = clone(e); reId([c]); c.x += off; c.y += off; page.elements.push(c); ids.push(c.id); }));
  select(ids);
}
function patchSel(patch, history = true) { change(() => selEls().forEach((e) => (typeof patch === 'function' ? patch(e) : Object.assign(e, patch))), { history }); }
function toggleLock() { const lock = !selEls().every((e) => e.locked); patchSel({ locked: lock }); syncTr(); updateCtx(); Panels.onSelection(); }
function order(where) {
  const p = curPage(), arr = p.elements, ids = new Set(Ed.sel);
  change(() => {
    const picked = arr.filter((e) => ids.has(e.id)); if (!picked.length) return;
    if (where === 'front') { p.elements = arr.filter((e) => !ids.has(e.id)).concat(picked); return; }
    if (where === 'back') { p.elements = picked.concat(arr.filter((e) => !ids.has(e.id))); return; }
    const step = where === 'forward' ? 1 : -1;
    const idxs = picked.map((e) => arr.indexOf(e)).sort((a, b) => (step > 0 ? b - a : a - b));
    idxs.forEach((i) => { const j = i + step; if (j < 0 || j >= arr.length || ids.has(arr[j].id)) return; [arr[i], arr[j]] = [arr[j], arr[i]]; });
  });
}
function alignSel(how) {
  const els = selEls(); if (!els.length) return;
  const boxes = els.map((e) => nodeOf(e.id).getClientRect({ relativeTo: Ed.content }));
  let ref = { x: 0, y: 0, width: Ed.design.width, height: Ed.design.height };
  if (els.length > 1) {
    const x1 = Math.min(...boxes.map((b) => b.x)), y1 = Math.min(...boxes.map((b) => b.y));
    ref = { x: x1, y: y1, width: Math.max(...boxes.map((b) => b.x + b.width)) - x1, height: Math.max(...boxes.map((b) => b.y + b.height)) - y1 };
  }
  change(() => els.forEach((e, i) => {
    const b = boxes[i];
    if (how === 'left') e.x += ref.x - b.x;
    if (how === 'hcenter') e.x += ref.x + ref.width / 2 - (b.x + b.width / 2);
    if (how === 'right') e.x += ref.x + ref.width - (b.x + b.width);
    if (how === 'top') e.y += ref.y - b.y;
    if (how === 'vcenter') e.y += ref.y + ref.height / 2 - (b.y + b.height / 2);
    if (how === 'bottom') e.y += ref.y + ref.height - (b.y + b.height);
  }));
}
function groupSel() {
  const p = curPage(), ids = new Set(Ed.sel);
  const picked = p.elements.filter((e) => ids.has(e.id));
  if (picked.length < 2) { toast(t('groupNeed2')); return; }
  const g = { id: uid(), type: 'group', x: 0, y: 0, rotation: 0, children: picked.map((e) => ({ ...e, locked: false })) };
  change(() => {
    const at = p.elements.indexOf(picked[picked.length - 1]);
    p.elements.splice(at + 1, 0, g); p.elements = p.elements.filter((e) => !ids.has(e.id));
  });
  select([g.id]);
}
function ungroupSel() {
  const p = curPage(), out = [];
  change(() => {
    selEls().filter((e) => e.type === 'group').forEach((g) => {
      const a = ((g.rotation || 0) * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
      const kids = g.children.map((c) => ({ ...c, x: g.x + c.x * cos - c.y * sin, y: g.y + c.x * sin + c.y * cos, rotation: (c.rotation || 0) + (g.rotation || 0), opacity: (c.opacity ?? 1) * (g.opacity ?? 1) }));
      p.elements.splice(p.elements.indexOf(g), 1, ...kids); out.push(...kids.map((k) => k.id));
    });
  });
  if (out.length) select(out);
}
function flipSel(axis) { patchSel((e) => { if (e.type !== 'text' && e.type !== 'group') e[axis] = !e[axis]; }); }

/* ---------- pages ---------- */
function gotoPage(i) { Ed.pi = clamp(i, 0, Ed.design.pages.length - 1); Ed.sel = []; renderPage(); Panels.onSelection(); }
function addPage() { change(() => { Ed.design.pages.splice(Ed.pi + 1, 0, { id: uid(), bg: { color: '#FFFFFF' }, elements: [] }); Ed.pi++; }); }
function dupPage() { change(() => { const c = clone(curPage()); c.id = uid(); reId(c.elements); Ed.design.pages.splice(Ed.pi + 1, 0, c); Ed.pi++; }); }
function delPage() {
  if (Ed.design.pages.length < 2) return;
  if (!confirm(t('confirmDelPage'))) return;
  change(() => { Ed.design.pages.splice(Ed.pi, 1); Ed.pi = Math.min(Ed.pi, Ed.design.pages.length - 1); Ed.sel = []; });
}
function movePage(dir) {
  const ps = Ed.design.pages, j = Ed.pi + dir; if (j < 0 || j >= ps.length) return;
  change(() => { [ps[Ed.pi], ps[j]] = [ps[j], ps[Ed.pi]]; Ed.pi = j; });
}
function updatePagebar() {
  const n = Ed.design.pages.length, rtl = document.documentElement.dir === 'rtl';
  const b = (i, act, title, dis) => `<button class="icon-btn" type="button" data-act="${act}" title="${esc(t(title))}" aria-label="${esc(t(title))}" ${dis ? 'disabled' : ''}>${icon(i, 20)}</button>`;
  $('#pagebar').innerHTML = [
    b(rtl ? 'chevron-right' : 'chevron-left', 'prev', 'page', Ed.pi === 0),
    `<span>${Ed.pi + 1} / ${n}</span>`,
    b(rtl ? 'chevron-left' : 'chevron-right', 'next', 'page', Ed.pi === n - 1),
    b('file-plus', 'add', 'addPage'), b('files', 'dup', 'dupPage'),
    n > 1 ? b(rtl ? 'arrow-right' : 'arrow-left', 'mprev', 'movePrev', Ed.pi === 0) : '',
    n > 1 ? b(rtl ? 'arrow-left' : 'arrow-right', 'mnext', 'moveNext', Ed.pi === n - 1) : '',
    n > 1 ? b('trash-2', 'del', 'delPage') : '',
  ].join('');
}

/* ---------- context toolbar ---------- */
function updateCtx() {
  const bar = $('#ctxbar'), els = selEls();
  if (!els.length) { bar.classList.add('hidden'); return; }
  const one = els.length === 1 ? els[0] : null, locked = els.some((e) => e.locked);
  const b = (i, act, title, cls = '') => `<button class="icon-btn ${cls}" type="button" data-act="${act}" title="${esc(t(title))}" aria-label="${esc(t(title))}">${icon(i, 20)}</button>`;
  bar.innerHTML = [
    one && one.type === 'text' && !locked ? b('pencil', 'edit', 'editText') : '',
    b('sliders-horizontal', 'props', 'props'),
    !locked ? b('copy', 'dup', 'duplicate') : '',
    els.length > 1 ? b('group', 'group', 'group') : '',
    one && one.type === 'group' ? b('ungroup', 'ungroup', 'ungroup') : '',
    !locked ? b('bring-to-front', 'front', 'toFront') : '',
    b(locked ? 'lock' : 'lock-open', 'lock', locked ? 'unlock' : 'lock', locked ? 'on' : ''),
    !locked ? b('trash-2', 'del', 'del') : '',
  ].join('');
  bar.classList.remove('hidden');
}

/* ---------- open / close ---------- */
async function openDesign(d) {
  Ed.design = d; Ed.pi = 0; Ed.sel = []; Ed.pool.clear(); Ed.poolRev.clear();
  Ed.hist = []; Ed.hi = 0; Ed.hist.push(snap()); Ed.multi = false; $('#multiBtn').classList.remove('on');
  $('#titleInput').value = d.title;
  showScreen('editor');
  if (!Ed.stage) initStage();
  resizeStage(); fit(); await renderPage();
  Panels.close();
}
async function closeEditor() { await saveSoon.flush(); Ed.design = null; Home.render(); showScreen('home'); }

function bindEditorUI() {
  $('#backBtn').onclick = closeEditor;
  $('#undoBtn').onclick = undo; $('#redoBtn').onclick = redo;
  $('#zoomIn').onclick = () => zoomAt(Ed.zoom * 1.25, Ed.stage.width() / 2, Ed.stage.height() / 2);
  $('#zoomOut').onclick = () => zoomAt(Ed.zoom / 1.25, Ed.stage.width() / 2, Ed.stage.height() / 2);
  $('#zoomFit').onclick = fit;
  $('#multiBtn').onclick = () => { Ed.multi = !Ed.multi; $('#multiBtn').classList.toggle('on', Ed.multi); if (Ed.multi) toast(t('multiOn')); };
  $('#titleInput').onchange = (e) => { Ed.design.title = e.target.value.trim() || t('untitled'); saveSoon(); };
  $('#downloadBtn').onclick = () => Panels.exportSheet();
  $('#resizeBtn').onclick = () => Panels.resizeSheet();
  $('#presentBtn').onclick = () => Panels.present();
  $('#pagebar').onclick = (e) => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    ({ prev: () => gotoPage(Ed.pi - 1), next: () => gotoPage(Ed.pi + 1), add: addPage, dup: dupPage, del: delPage, mprev: () => movePage(-1), mnext: () => movePage(1) })[a.dataset.act]();
  };
  $('#ctxbar').onclick = (e) => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    ({ edit: () => Panels.editText(selEls()[0]), props: () => Panels.open('props'), dup: dupSel, group: groupSel, ungroup: ungroupSel, front: () => order('front'), lock: toggleLock, del: delSel })[a.dataset.act]();
  };
  document.addEventListener('keydown', (e) => {
    if (!Ed.design || $('#editor').classList.contains('hidden')) return;
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (!$('#sheetBack').classList.contains('hidden')) return;
    const mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
    if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && k === 'y') { e.preventDefault(); redo(); return; }
    if (mod && k === 'd') { e.preventDefault(); dupSel(); return; }
    if (mod && k === 'c') { copySel(); return; }
    if (mod && k === 'v') { e.preventDefault(); paste(); return; }
    if (mod && k === 'g') { e.preventDefault(); e.shiftKey ? ungroupSel() : groupSel(); return; }
    if (mod && k === 'a') { e.preventDefault(); select(curPage().elements.map((x) => x.id)); return; }
    if (k === 'delete' || k === 'backspace') { e.preventDefault(); delSel(); return; }
    if (k === 'escape') { select([]); return; }
    const arrows = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] };
    if (arrows[k] && Ed.sel.length) {
      e.preventDefault(); const s = e.shiftKey ? 10 : 1;
      patchSel((el) => { if (!el.locked) { el.x += arrows[k][0] * s; el.y += arrows[k][1] * s; } });
    }
  });
}
