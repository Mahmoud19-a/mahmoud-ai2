'use strict';
/* Turning the design JSON into Konva nodes, plus export helpers. */

const FONTS = [
  { f: 'Cairo', ar: 1 }, { f: 'Tajawal', ar: 1 }, { f: 'Changa', ar: 1 }, { f: 'Reem Kufi', ar: 1 },
  { f: 'Lalezar', ar: 1 }, { f: 'Amiri', ar: 1 }, { f: 'Montserrat' }, { f: 'Playfair Display' },
  { f: 'Oswald' }, { f: 'Bebas Neue' }, { f: 'Lobster' }, { f: 'Pacifico' },
  { f: 'Georgia', sys: 1 }, { f: 'Courier New', sys: 1 },
];
const fontStack = (f) => `"${f}", "Cairo", sans-serif`;

function walk(els, fn) { (els || []).forEach((e) => { fn(e); if (e.type === 'group') walk(e.children, fn); }); }

async function ensureFonts(page) {
  const fams = new Set();
  walk(page.elements, (e) => { if (e.type === 'text') fams.add(e.fontFamily); });
  if (!document.fonts || !fams.size) return;
  const loads = [];
  fams.forEach((f) => { loads.push(document.fonts.load(`400 32px "${f}"`, 'Aaعر'), document.fonts.load(`bold 32px "${f}"`, 'Aaعر')); });
  await Promise.race([Promise.all(loads).catch(() => {}), new Promise((r) => setTimeout(r, 2500))]);
}
async function preloadPage(page) {
  const srcs = [];
  if (page.bg && page.bg.image) srcs.push(page.bg.image);
  walk(page.elements, (e) => {
    if (e.type === 'image') srcs.push(e.src);
    if (e.type === 'icon') srcs.push(iconSrc(e.icon, e.fill, e.strokeWidth));
  });
  await Promise.all(srcs.map(preloadSrc));
}

/* ---------- shape geometry, drawn inside a w×h box ---------- */
const SHAPES = ['rect', 'roundrect', 'ellipse', 'triangle', 'rtriangle', 'diamond', 'pentagon', 'hexagon', 'octagon', 'star', 'heart', 'arrow', 'speech', 'cross'];
function rrect(ctx, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.arcTo(w, 0, w, r, r); ctx.lineTo(w, h - r); ctx.arcTo(w, h, w - r, h, r);
  ctx.lineTo(r, h); ctx.arcTo(0, h, 0, h - r, r); ctx.lineTo(0, r); ctx.arcTo(0, 0, r, 0, r); ctx.closePath();
}
function poly(ctx, pts, w, h) { pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h))); ctx.closePath(); }
function ngon(n, inner = 0) {
  const pts = []; const k = inner ? n * 2 : n;
  for (let i = 0; i < k; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / k; const r = inner && i % 2 ? inner : 1;
    pts.push([0.5 + 0.5 * r * Math.cos(a), 0.5 + 0.5 * r * Math.sin(a)]);
  }
  if (n === 5 || inner) { // fit vertically: pentagon/star bottom sits above the box bottom
    const ys = pts.map((p) => p[1]); const mn = Math.min(...ys), mx = Math.max(...ys);
    pts.forEach((p) => { p[1] = (p[1] - mn) / (mx - mn); });
  }
  return pts;
}
function shapePath(ctx, kind, w, h, radius = 0) {
  ctx.beginPath();
  switch (kind) {
    case 'rect': rrect(ctx, w, h, radius); break;
    case 'roundrect': rrect(ctx, w, h, radius || Math.min(w, h) * 0.18); break;
    case 'ellipse': ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.closePath(); break;
    case 'triangle': poly(ctx, [[0.5, 0], [1, 1], [0, 1]], w, h); break;
    case 'rtriangle': poly(ctx, [[0, 0], [1, 1], [0, 1]], w, h); break;
    case 'diamond': poly(ctx, [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]], w, h); break;
    case 'pentagon': poly(ctx, ngon(5), w, h); break;
    case 'hexagon': poly(ctx, [[0.25, 0], [0.75, 0], [1, 0.5], [0.75, 1], [0.25, 1], [0, 0.5]], w, h); break;
    case 'octagon': poly(ctx, [[0.3, 0], [0.7, 0], [1, 0.3], [1, 0.7], [0.7, 1], [0.3, 1], [0, 0.7], [0, 0.3]], w, h); break;
    case 'star': poly(ctx, ngon(5, 0.42), w, h); break;
    case 'cross': poly(ctx, [[0.33, 0], [0.67, 0], [0.67, 0.33], [1, 0.33], [1, 0.67], [0.67, 0.67], [0.67, 1], [0.33, 1], [0.33, 0.67], [0, 0.67], [0, 0.33], [0.33, 0.33]], w, h); break;
    case 'arrow': poly(ctx, [[0, 0.3], [0.6, 0.3], [0.6, 0], [1, 0.5], [0.6, 1], [0.6, 0.7], [0, 0.7]], w, h); break;
    case 'heart': {
      const X = (v) => v * w, Y = (v) => v * h;
      ctx.moveTo(X(0.5), Y(1));
      ctx.bezierCurveTo(X(0.12), Y(0.7), X(0), Y(0.48), X(0), Y(0.28));
      ctx.bezierCurveTo(X(0), Y(0.1), X(0.14), Y(0), X(0.29), Y(0));
      ctx.bezierCurveTo(X(0.4), Y(0), X(0.47), Y(0.06), X(0.5), Y(0.15));
      ctx.bezierCurveTo(X(0.53), Y(0.06), X(0.6), Y(0), X(0.71), Y(0));
      ctx.bezierCurveTo(X(0.86), Y(0), X(1), Y(0.1), X(1), Y(0.28));
      ctx.bezierCurveTo(X(1), Y(0.48), X(0.88), Y(0.7), X(0.5), Y(1));
      ctx.closePath(); break;
    }
    case 'speech': {
      const H = h * 0.78, r = Math.min(w, H) * 0.14;
      ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.arcTo(w, 0, w, r, r); ctx.lineTo(w, H - r); ctx.arcTo(w, H, w - r, H, r);
      ctx.lineTo(w * 0.4, H); ctx.lineTo(w * 0.2, h); ctx.lineTo(w * 0.24, H);
      ctx.lineTo(r, H); ctx.arcTo(0, H, 0, H - r, r); ctx.lineTo(0, r); ctx.arcTo(0, 0, r, 0, r); ctx.closePath(); break;
    }
    default: rrect(ctx, w, h, 0);
  }
}

function hasFilters(el) { const f = el.filters; return !!f && (f.brightness || f.contrast || f.saturation || f.blur || f.grayscale || f.sepia); }
function applyFilters(node, el) {
  const f = el.filters; const list = [];
  if (f.brightness) { list.push(Konva.Filters.Brighten); node.brightness(f.brightness); }
  if (f.contrast) { list.push(Konva.Filters.Contrast); node.contrast(f.contrast); }
  if (f.saturation) { list.push(Konva.Filters.HSL); node.saturation(f.saturation); }
  if (f.blur) { list.push(Konva.Filters.Blur); node.blurRadius(f.blur); }
  if (f.grayscale) list.push(Konva.Filters.Grayscale);
  if (f.sepia) list.push(Konva.Filters.Sepia);
  const big = Math.max(el.w, el.h);
  node.cache({ pixelRatio: clamp(1600 / big, 0.5, 2) });
  node.filters(list);
}
function shadowAttrs(el) {
  const s = el.shadow;
  if (!s) return { shadowEnabled: false };
  return { shadowEnabled: true, shadowColor: s.color || '#000', shadowBlur: s.blur ?? 10, shadowOffsetX: s.x ?? 4, shadowOffsetY: s.y ?? 4, shadowOpacity: s.opacity ?? 0.5 };
}

/* Build a Konva node for one element. `live` = interactive editor canvas. */
function makeNode(el, live = false, isChild = false) {
  const base = {
    id: el.id, x: el.x, y: el.y, rotation: el.rotation || 0, opacity: el.opacity ?? 1,
    draggable: live && !isChild && !el.locked, listening: live, visible: !el.hidden, name: 'el',
  };
  let node;
  switch (el.type) {
    case 'text': {
      const dir = textDir(el.text);
      node = new Konva.Text({
        ...base, text: el.text, width: el.w, fontSize: el.fontSize, fontFamily: fontStack(el.fontFamily),
        fontStyle: `${el.italic ? 'italic ' : ''}${el.bold ? 'bold' : 'normal'}`, textDecoration: el.underline ? 'underline' : '',
        fill: el.fill, align: el.align || 'center', lineHeight: el.lineHeight || 1.25, letterSpacing: dir === 'rtl' ? 0 : (el.letterSpacing || 0),
        direction: dir, stroke: el.strokeWidth ? el.stroke : undefined, strokeWidth: el.strokeWidth || 0, fillAfterStrokeEnabled: true,
        ...shadowAttrs(el),
      });
      break;
    }
    case 'shape': {
      const { kind, w, h, radius } = el;
      node = new Konva.Shape({
        ...base, width: w, height: h, fill: el.fill || undefined, stroke: el.strokeWidth ? el.stroke : undefined, strokeWidth: el.strokeWidth || 0,
        ...shadowAttrs(el),
        sceneFunc(ctx, shape) { shapePath(ctx, kind, w, h, radius || 0); ctx.fillStrokeShape(shape); },
      });
      break;
    }
    case 'line': {
      node = new Konva.Arrow({
        ...base, points: [0, 0, el.w, 0], stroke: el.stroke, strokeWidth: el.strokeWidth, fill: el.stroke,
        dash: el.dash ? [el.strokeWidth * 2.5, el.strokeWidth * 1.8] : undefined, lineCap: 'round',
        pointerAtBeginning: !!el.arrowStart, pointerAtEnding: !!el.arrowEnd,
        pointerLength: el.strokeWidth * 3.5, pointerWidth: el.strokeWidth * 3.5, hitStrokeWidth: Math.max(30, el.strokeWidth + 20),
        ...shadowAttrs(el),
      });
      break;
    }
    case 'image': case 'icon': {
      const src = el.type === 'icon' ? iconSrc(el.icon, el.fill, el.strokeWidth) : el.src;
      const im = imgReady.get(src);
      const attrs = { ...base, image: im, width: el.w, height: el.h, cornerRadius: el.radius || 0, ...shadowAttrs(el) };
      if (el.type === 'image' && el.crop && im) {
        const c = el.crop, nw = im.naturalWidth, nh = im.naturalHeight;
        attrs.crop = { x: c.l * nw, y: c.t * nh, width: Math.max(1, (1 - c.l - c.r) * nw), height: Math.max(1, (1 - c.t - c.b) * nh) };
      }
      node = new Konva.Image(attrs);
      if (el.type === 'image' && im && hasFilters(el)) applyFilters(node, el);
      break;
    }
    case 'group': {
      node = new Konva.Group(base);
      (el.children || []).forEach((c) => node.add(makeNode(c, live, true)));
      break;
    }
    default: node = new Konva.Group(base);
  }
  if (el.type !== 'text' && el.type !== 'group') {
    if (el.flipX) { node.scaleX(-1); node.offsetX(el.w); }
    if (el.flipY) { node.scaleY(-1); node.offsetY(el.h || 0); }
  }
  return node;
}

function bgNodes(page, W, H) {
  const bg = page.bg || { color: '#ffffff' };
  const out = [];
  const r = new Konva.Rect({ x: 0, y: 0, width: W, height: H, listening: false, name: 'bg' });
  if (bg.color2) {
    const a = ((bg.angle ?? 135) * Math.PI) / 180, dx = (Math.cos(a) * W) / 2, dy = (Math.sin(a) * H) / 2;
    r.setAttrs({ fillLinearGradientStartPoint: { x: W / 2 - dx, y: H / 2 - dy }, fillLinearGradientEndPoint: { x: W / 2 + dx, y: H / 2 + dy }, fillLinearGradientColorStops: [0, bg.color, 1, bg.color2] });
  } else r.fill(bg.color || '#ffffff');
  out.push(r);
  const im = bg.image && imgReady.get(bg.image);
  if (im) {
    const s = Math.max(W / im.naturalWidth, H / im.naturalHeight);
    const cw = W / s, ch = H / s;
    out.push(new Konva.Image({ x: 0, y: 0, width: W, height: H, image: im, listening: false, name: 'bg', opacity: bg.imageOpacity ?? 1,
      crop: { x: (im.naturalWidth - cw) / 2, y: (im.naturalHeight - ch) / 2, width: cw, height: ch } }));
  }
  return out;
}

const MAX_PIXELS = 16_000_000; // iOS canvas limit is ~16.7M pixels
function safeRatio(W, H, want) { return Math.max(0.05, Math.min(want, Math.sqrt(MAX_PIXELS / (W * H)))); }

async function renderPageToCanvas(design, page, pixelRatio = 1, transparent = false) {
  await ensureFonts(page); await preloadPage(page);
  const W = design.width, H = design.height;
  const div = document.createElement('div');
  const st = new Konva.Stage({ container: div, width: W, height: H });
  const ly = new Konva.Layer({ listening: false }); st.add(ly);
  if (!transparent) bgNodes(page, W, H).forEach((n) => ly.add(n));
  page.elements.forEach((el) => ly.add(makeNode(el, false)));
  ly.draw();
  const canvas = st.toCanvas({ pixelRatio: safeRatio(W, H, pixelRatio) });
  st.destroy();
  return canvas;
}
async function pageThumb(design, page, maxW = 360) {
  const r = maxW / Math.max(design.width, design.height);
  const c = await renderPageToCanvas(design, page, r);
  return c.toDataURL('image/jpeg', 0.75);
}

/* Scale an element's size (not its x/y) by s, recursively for groups. */
function scaleEl(el, s) {
  const k = (p) => { if (el[p] != null) el[p] *= s; };
  switch (el.type) {
    case 'text': k('fontSize'); k('w'); k('strokeWidth'); k('letterSpacing'); break;
    case 'shape': k('w'); k('h'); k('strokeWidth'); k('radius'); break;
    case 'image': case 'icon': k('w'); k('h'); k('radius'); break;
    case 'line': k('w'); k('strokeWidth'); break;
    case 'group': el.children.forEach((c) => { c.x *= s; c.y *= s; scaleEl(c, s); }); break;
  }
  if (el.shadow) { el.shadow.blur *= s; el.shadow.x *= s; el.shadow.y *= s; }
}
function fitPageInto(page, fromW, fromH, toW, toH) {
  const s = Math.min(toW / fromW, toH / fromH), dx = (toW - fromW * s) / 2, dy = (toH - fromH * s) / 2;
  page.elements.forEach((el) => { el.x = el.x * s + dx; el.y = el.y * s + dy; scaleEl(el, s); });
  return page;
}
function reId(els) { walk(els, (e) => { e.id = uid(); }); return els; }
