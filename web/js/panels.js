'use strict';
/* Side/bottom panels, property editors and modal sheets. */

const TABS = [
  ['templates', 'layout-template', 'tabTemplates'], ['text', 'type', 'tabText'], ['elements', 'shapes', 'tabElements'],
  ['uploads', 'upload', 'tabUploads'], ['background', 'paint-bucket', 'tabBackground'], ['layers', 'layers', 'tabLayers'], ['brand', 'palette', 'tabBrand'],
];
const wide = () => matchMedia('(min-width: 820px)').matches;

/* ---------- modal sheet ---------- */
function openSheet(title, html, onClose) {
  $('#sheetTitle').textContent = title; $('#sheetBody').innerHTML = html;
  $('#sheetBack').classList.remove('hidden'); openSheet.onClose = onClose;
  return $('#sheetBody');
}
function closeSheet() {
  if ($('#sheetBack').classList.contains('hidden')) return;
  $('#sheetBack').classList.add('hidden'); $('#sheetBody').innerHTML = '';
  const f = openSheet.onClose; openSheet.onClose = null; if (f) f();
}

/* ---------- small UI builders ---------- */
const cbs = {};
let cbN = 0;
const reg = (fn) => { const k = 'k' + (++cbN); cbs[k] = fn; return k; };
const sameColor = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();
function docColors() {
  const s = new Set(); if (!Ed.design) return [];
  Ed.design.pages.forEach((p) => { if (p.bg) { s.add(p.bg.color); if (p.bg.color2) s.add(p.bg.color2); } walk(p.elements, (e) => { if (e.fill) s.add(e.fill); if (e.stroke && e.strokeWidth) s.add(e.stroke); }); });
  return [...s].filter((c) => /^#[0-9a-f]{6}$/i.test(c));
}
function colorRow(value, fn, allowNone = false) {
  const k = reg(fn);
  const list = [...new Set([...App.brand.colors, ...docColors(), ...DEFAULT_COLORS].map((c) => c.toUpperCase()))].slice(0, 26);
  return `<div class="swatches" data-ckey="${k}">${allowNone ? `<button class="sw none ${!value ? 'on' : ''}" data-c="" type="button" aria-label="${esc(t('none'))}"></button>` : ''}${
    list.map((c) => `<button class="sw ${sameColor(c, value) ? 'on' : ''}" style="background:${c}" data-c="${c}" type="button" aria-label="${c}"></button>`).join('')
  }<label class="sw sw-pick" title="+"><input type="color" value="${/^#[0-9a-f]{6}$/i.test(value || '') ? value : '#000000'}" data-cpick></label></div>`;
}
function rangeRow(label, value, min, max, step, fn, fmt = (v) => v) {
  const k = reg(fn);
  return `<div class="sec"><label>${esc(label)}</label><div class="range"><input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-rkey="${k}"><output>${fmt(value)}</output></div></div>`;
}
function bindControls(root) {
  root.addEventListener('click', (e) => {
    const c = e.target.closest('[data-c]');
    if (c) { const k = c.closest('[data-ckey]').dataset.ckey; cbs[k](c.dataset.c, true); $$('.sw', c.parentNode).forEach((s) => s.classList.toggle('on', s === c)); }
  });
  root.addEventListener('input', (e) => {
    const r = e.target;
    if (r.matches('[data-rkey]')) { cbs[r.dataset.rkey](parseFloat(r.value), false); const o = r.parentNode.querySelector('output'); if (o) o.textContent = r.dataset.fmt === 'pct' ? Math.round(r.value * 100) + '%' : r.value; }
    if (r.matches('[data-cpick]')) cbs[r.closest('[data-ckey]').dataset.ckey](r.value, false);
  });
  root.addEventListener('change', (e) => {
    const r = e.target;
    if (r.matches('[data-rkey]')) cbs[r.dataset.rkey](parseFloat(r.value), true);
    if (r.matches('[data-cpick]')) cbs[r.closest('[data-ckey]').dataset.ckey](r.value, true);
  });
}
const btn = (i, act, label, on = false) => `<button class="tool ${on ? 'on' : ''}" type="button" data-act="${act}">${icon(i, 20)}<span>${esc(label)}</span></button>`;
function shapePreview(kind) {
  const c = document.createElement('canvas'); c.width = 96; c.height = 96; const g = c.getContext('2d');
  g.translate(10, 10); shapePath(g, kind, 76, 76, 0); g.fillStyle = '#1F2A44'; g.fill();
  return c.toDataURL();
}
let shapePreviews = null;

/* ---------- Panels ---------- */
const Panels = {
  tab: null, lastTab: 'templates',
  init() {
    $('#tabs').innerHTML = TABS.map(([id, i, l]) => `<button class="tab" type="button" data-tab="${id}">${icon(i, 22)}<span>${esc(t(l))}</span></button>`).join('');
    $('#tabs').onclick = (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; this.tab === b.dataset.tab && !wide() ? this.close() : this.open(b.dataset.tab); };
    $('#panelClose').onclick = () => this.close();
    bindControls($('#panelBody'));
    bindControls($('#sheetBody'));
    $('#sheetClose').onclick = closeSheet;
    $('#sheetBack').addEventListener('click', (e) => { if (e.target.id === 'sheetBack') closeSheet(); });
    $('#panelBody').addEventListener('click', (e) => this.onClick(e));
  },
  open(tab) {
    if (tab !== 'props') this.lastTab = tab;
    this.tab = tab; $('#panel').classList.remove('hidden');
    $$('#tabs .tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    this.render();
  },
  close() {
    if (wide()) { this.open(this.lastTab); return; }
    this.tab = null; $('#panel').classList.add('hidden'); $$('#tabs .tab').forEach((b) => b.classList.remove('on'));
  },
  onSelection() {
    if (!Ed.design) return;
    if (Ed.sel.length && (this.tab === 'props' || wide())) this.open('props');
    else if (!Ed.sel.length && this.tab === 'props') { wide() ? this.open(this.lastTab) : this.close(); }
    else if (this.tab === 'layers') this.render();
  },
  onRender() { if (this.tab === 'layers') this.render(); },
  render() {
    const body = $('#panelBody'); const tab = this.tab; if (!tab) return;
    $('#panelTitle').textContent = t(tab === 'props' ? 'tabProps' : TABS.find((x) => x[0] === tab)[2]);
    (this._keys || []).forEach((k) => delete cbs[k]);
    const start = cbN;
    body.innerHTML = this['p_' + tab]();
    this._keys = []; for (let i = start + 1; i <= cbN; i++) this._keys.push('k' + i);
    if (tab === 'templates') Home.fillThumbs(body);
  },

  /* ----- templates ----- */
  p_templates() {
    return `<div class="tiles big">${TEMPLATES.map((tp) => `<button class="card" type="button" data-tpl="${tp.id}"><div class="thumb"><img data-thumb="${tp.id}" alt=""></div><div class="meta"><b>${esc(tt(tp.title))}</b></div></button>`).join('')}</div>`;
  },
  /* ----- text ----- */
  p_text() {
    return `<button class="addtext" type="button" data-add="h" style="font-size:24px;font-weight:800">${esc(t('addHeading'))}</button>
      <button class="addtext" type="button" data-add="s" style="font-size:18px;font-weight:700">${esc(t('addSubheading'))}</button>
      <button class="addtext" type="button" data-add="b" style="font-size:14px">${esc(t('addBody'))}</button>
      <div class="sec-title" style="margin-top:16px">${esc(t('textCombos'))}</div>
      <div class="tiles big">${TEXT_COMBOS.map((c, i) => `<button class="tile text" type="button" data-combo="${i}" style="font-family:${esc(fontStack(c.els[c.els.length - 1].fontFamily))};color:${c.els[c.els.length - 1].fill}">${esc(c.label)}</button>`).join('')}</div>`;
  },
  /* ----- elements ----- */
  p_elements() {
    shapePreviews = shapePreviews || Object.fromEntries(SHAPES.map((s) => [s, shapePreview(s)]));
    const lineSvg = (dash, a1, a2) => `<svg viewBox="0 0 60 20" width="56"><line x1="${a1 ? 10 : 4}" y1="10" x2="${a2 ? 50 : 56}" y2="10" stroke="#1F2A44" stroke-width="3" ${dash ? 'stroke-dasharray="6 4"' : ''}/>${a1 ? '<path d="M12 4 L3 10 L12 16 Z" fill="#1F2A44"/>' : ''}${a2 ? '<path d="M48 4 L57 10 L48 16 Z" fill="#1F2A44"/>' : ''}</svg>`;
    return `<div class="sec"><label>${esc(t('shapes'))}</label><div class="tiles">${SHAPES.map((s) => `<button class="tile" type="button" data-shape="${s}" aria-label="${s}"><img src="${shapePreviews[s]}" alt=""></button>`).join('')}</div></div>
      <div class="sec"><label>${esc(t('lines'))}</label><div class="tiles">
        <button class="tile" type="button" data-line="0,0,0">${lineSvg(0, 0, 0)}</button><button class="tile" type="button" data-line="1,0,0">${lineSvg(1, 0, 0)}</button>
        <button class="tile" type="button" data-line="0,0,1">${lineSvg(0, 0, 1)}</button><button class="tile" type="button" data-line="0,1,1">${lineSvg(0, 1, 1)}</button></div></div>
      <div class="sec"><label>${esc(t('icons'))}</label><div class="tiles">${STICKER_ICONS.map((n) => `<button class="tile" type="button" data-icon="${n}" aria-label="${n}">${icon(n, 30)}</button>`).join('')}</div></div>
      <div class="sec"><label>${esc(t('emoji'))}</label><div class="tiles">${EMOJI.map((e) => `<button class="tile text" type="button" data-emoji="${e}">${e}</button>`).join('')}</div></div>`;
  },
  /* ----- uploads ----- */
  p_uploads() {
    const ups = App.uploads;
    return `<button class="btn primary" type="button" data-act="upload" style="width:100%">${icon('upload', 20)}${esc(t('upload'))}</button>
      <p class="hint">${esc(t('uploadHint'))}</p>
      ${ups.length ? `<div class="tiles">${ups.map((u) => `<div class="tile" data-up="${u.id}" role="button" tabindex="0"><img src="${u.src}" alt=""><button class="icon-btn x" type="button" data-updel="${u.id}" aria-label="${esc(t('del'))}">${icon('x', 16)}</button></div>`).join('')}</div>` : `<div class="empty">${esc(t('noUploads'))}</div>`}`;
  },
  /* ----- background ----- */
  p_background() {
    const bg = curPage().bg || {};
    const set = (patch) => (v, hist) => change(() => { const p = curPage(); p.bg = { ...p.bg, ...patch(v) }; }, { history: hist });
    return `<div class="sec"><label>${esc(t('bgColor'))}</label>${colorRow(bg.color2 ? '' : bg.color, set((v) => ({ color: v, color2: null })))}</div>
      <div class="sec"><label>${esc(t('gradients'))}</label><div class="tiles">${GRADIENTS.map(([a, b], i) => `<button class="tile" type="button" data-grad="${i}" style="background:linear-gradient(135deg,${a},${b})" aria-label="${a} ${b}"></button>`).join('')}</div></div>
      <div class="sec"><label>${esc(t('bgImage'))}</label>
        ${bg.image ? `<button class="btn small danger" type="button" data-act="bgnone">${icon('x', 16)}${esc(t('removeBgImage'))}</button>${rangeRow(t('opacity'), bg.imageOpacity ?? 1, 0, 1, 0.05, set((v) => ({ imageOpacity: v })), (v) => Math.round(v * 100) + '%').replace('data-rkey', 'data-fmt="pct" data-rkey')}` : ''}
        ${App.uploads.length ? `<p class="hint">${esc(t('pickFromUploads'))}</p><div class="tiles">${App.uploads.map((u) => `<button class="tile" type="button" data-bgimg="${u.id}"><img src="${u.src}" alt=""></button>`).join('')}</div>`
          : `<button class="btn small" type="button" data-act="upload">${icon('upload', 16)}${esc(t('upload'))}</button>`}
      </div>`;
  },
  /* ----- layers ----- */
  p_layers() {
    const els = curPage().elements.slice().reverse();
    if (!els.length) return `<div class="empty">${esc(t('layersEmpty'))}</div>`;
    const label = (e) => e.type === 'text' ? e.text.split('\n')[0].slice(0, 30) : t({ shape: 'elShape', image: 'elImage', icon: 'elIcon', line: 'elLine', group: 'elGroup' }[e.type]);
    const ic = { text: 'type', shape: 'shapes', image: 'image', icon: 'smile', line: 'arrow-right', group: 'group' };
    return els.map((e) => `<div class="layer-row ${Ed.sel.includes(e.id) ? 'on' : ''}" data-layer="${e.id}">${icon(ic[e.type], 18)}<span class="name">${esc(label(e))}</span>
      <button class="icon-btn" type="button" data-lact="hide" aria-label="hide">${icon(e.hidden ? 'eye-off' : 'eye', 18)}</button>
      <button class="icon-btn" type="button" data-lact="lock" aria-label="lock">${icon(e.locked ? 'lock' : 'lock-open', 18)}</button>
      <button class="icon-btn" type="button" data-lact="up" aria-label="${esc(t('forward'))}">${icon('chevron-up', 18)}</button>
      <button class="icon-btn" type="button" data-lact="down" aria-label="${esc(t('backward'))}">${icon('chevron-down', 18)}</button></div>`).join('');
  },
  /* ----- brand ----- */
  p_brand() {
    const b = App.brand;
    const fontSel = (key, val) => `<select class="field" data-brandfont="${key}">${FONTS.map((f) => `<option value="${esc(f.f)}" ${f.f === val ? 'selected' : ''}>${esc(f.f)}</option>`).join('')}</select>`;
    return `<p class="hint">${esc(t('brandHint'))}</p>
      <div class="sec"><label>${esc(t('brandColors'))}</label><div class="swatches">${b.colors.map((c, i) => `<span style="position:relative"><span class="sw" style="background:${c};display:block"></span><button class="icon-btn" type="button" data-bcdel="${i}" style="position:absolute;top:-10px;inset-inline-end:-12px;width:22px;height:22px;background:#fff;border-radius:50%" aria-label="${esc(t('del'))}">${icon('x', 12)}</button></span>`).join('')}
        <label class="sw sw-pick" title="${esc(t('addColor'))}"><input type="color" value="#E4572E" data-brandadd></label></div></div>
      <div class="sec"><label>${esc(t('headingFont'))}</label>${fontSel('headingFont', b.headingFont)}</div>
      <div class="sec"><label>${esc(t('bodyFont'))}</label>${fontSel('bodyFont', b.bodyFont)}</div>`;
  },

  /* ----- properties of the selection ----- */
  p_props() {
    const els = selEls(); if (!els.length) return '';
    const one = els.length === 1 ? els[0] : null, e = one || {};
    const live = (fn) => (v, hist) => patchSel((x) => fn(x, v), hist);
    let h = '';
    if (one && one.type === 'text') {
      const k = reg((v, hist) => patchSel((x) => { x.text = v; }, hist));
      h += `<div class="sec"><label>${esc(t('text'))}</label><textarea class="field" data-tkey="${k}" dir="auto">${esc(e.text)}</textarea></div>
        <div class="sec"><label>${esc(t('font'))}</label><button class="field" type="button" data-act="font" style="text-align:start;font-family:${esc(fontStack(e.fontFamily))};font-size:18px">${esc(e.fontFamily)}</button></div>
        ${rangeRow(t('size'), Math.round(e.fontSize), 6, Math.max(400, Math.round(e.fontSize)), 1, live((x, v) => { x.fontSize = v; }))}
        <div class="sec row">
          <div class="seg"><button type="button" data-act="bold" class="${e.bold ? 'on' : ''}">${icon('bold', 18)}</button><button type="button" data-act="italic" class="${e.italic ? 'on' : ''}">${icon('italic', 18)}</button><button type="button" data-act="underline" class="${e.underline ? 'on' : ''}">${icon('underline', 18)}</button></div>
          <div class="seg">${['left', 'center', 'right'].map((a) => `<button type="button" data-align="${a}" class="${(e.align || 'center') === a ? 'on' : ''}">${icon('align-' + a, 18)}</button>`).join('')}</div>
        </div>
        <div class="sec"><label>${esc(t('color'))}</label>${colorRow(e.fill, live((x, v) => { x.fill = v; }))}</div>
        ${rangeRow(t('lineHeight'), e.lineHeight || 1.25, 0.7, 3, 0.05, live((x, v) => { x.lineHeight = v; }))}
        ${textDir(e.text) === 'ltr' ? rangeRow(t('letterSpacing'), e.letterSpacing || 0, -5, 60, 1, live((x, v) => { x.letterSpacing = v; })) : ''}
        <div class="sec"><label>${esc(t('outline'))}</label>${colorRow(e.stroke || '#1F2A44', live((x, v) => { x.stroke = v; if (!x.strokeWidth) x.strokeWidth = Math.max(1, x.fontSize / 30); }))}</div>
        ${rangeRow(t('strokeWidth'), e.strokeWidth || 0, 0, Math.max(20, Math.round(e.fontSize / 5)), 0.5, live((x, v) => { x.strokeWidth = v; }))}`;
    }
    if (one && one.type === 'shape') {
      h += `<div class="sec"><label>${esc(t('fill'))}</label>${colorRow(e.fill, live((x, v) => { x.fill = v; }), true)}</div>
        <div class="sec"><label>${esc(t('stroke'))}</label>${colorRow(e.stroke, live((x, v) => { x.stroke = v; if (!x.strokeWidth) x.strokeWidth = Math.max(2, Math.min(x.w, x.h) / 40); }))}</div>
        ${rangeRow(t('strokeWidth'), e.strokeWidth || 0, 0, Math.max(40, Math.round(Math.min(e.w, e.h) / 4)), 0.5, live((x, v) => { x.strokeWidth = v; }))}
        ${e.kind === 'rect' || e.kind === 'roundrect' ? rangeRow(t('radius'), Math.round(e.radius || 0), 0, Math.round(Math.min(e.w, e.h) / 2), 1, live((x, v) => { x.radius = v; })) : ''}`;
    }
    if (one && one.type === 'line') {
      h += `<div class="sec"><label>${esc(t('color'))}</label>${colorRow(e.stroke, live((x, v) => { x.stroke = v; }))}</div>
        ${rangeRow(t('strokeWidth'), e.strokeWidth, 1, Math.max(60, e.strokeWidth), 0.5, live((x, v) => { x.strokeWidth = v; }))}
        <div class="toolgrid sec">${btn('more-horizontal', 'dash', t('dash'), e.dash)}${btn('arrow-left', 'arrowStart', t('arrowStart'), e.arrowStart)}${btn('arrow-right', 'arrowEnd', t('arrowEnd'), e.arrowEnd)}</div>`;
    }
    if (one && one.type === 'icon') {
      h += `<div class="sec"><label>${esc(t('color'))}</label>${colorRow(e.fill, live((x, v) => { x.fill = v; }))}</div>
        ${rangeRow(t('strokeWidth'), e.strokeWidth || 2, 0.5, 4, 0.1, live((x, v) => { x.strokeWidth = v; }))}`;
    }
    if (one && one.type === 'image') {
      const f = e.filters || {};
      const fl = (key) => live((x, v) => { x.filters = { ...(x.filters || {}), [key]: v }; });
      h += `<div class="toolgrid sec">${btn('crop', 'crop', t('crop'))}${btn('image', 'setbg', t('setAsBg'))}${btn('eye-off', 'gray', t('grayscale'), f.grayscale)}${btn('sun', 'sepia', t('sepia'), f.sepia)}${btn('undo-2', 'freset', t('reset'))}</div>
        ${rangeRow(t('brightness'), f.brightness || 0, -0.5, 0.5, 0.02, fl('brightness'))}
        ${rangeRow(t('contrast'), f.contrast || 0, -60, 60, 1, fl('contrast'))}
        ${rangeRow(t('saturation'), f.saturation || 0, -2, 2, 0.05, fl('saturation'))}
        ${rangeRow(t('blur'), f.blur || 0, 0, 30, 1, fl('blur'))}
        ${rangeRow(t('radius'), Math.round(e.radius || 0), 0, Math.round(Math.min(e.w, e.h) / 2), 1, live((x, v) => { x.radius = v; }))}`;
    }
    if (one && one.type !== 'group' && one.type !== 'line') {
      h += `<div class="toolgrid sec">${btn('square-dashed-mouse-pointer', 'shadow', t('shadow'), !!e.shadow)}</div>`;
    }
    const op = one ? (e.opacity ?? 1) : 1;
    h += `<div class="sec">${rangeRow(t('opacity'), op, 0, 1, 0.01, live((x, v) => { x.opacity = v; }), (v) => Math.round(v * 100) + '%').replace('data-rkey', 'data-fmt="pct" data-rkey')}</div>
      <div class="sec"><label>${esc(t('arrange'))}</label><div class="toolgrid">${btn('arrow-up-to-line', 'front', t('toFront'))}${btn('chevron-up', 'forward', t('forward'))}${btn('chevron-down', 'backward', t('backward'))}${btn('arrow-down-to-line', 'back', t('toBack'))}</div></div>
      <div class="sec"><label>${esc(t(els.length > 1 ? 'align' : 'alignPage'))}</label><div class="toolgrid">
        ${btn('align-start-vertical', 'al-left', '⇤')}${btn('align-center-vertical', 'al-hcenter', '↔')}${btn('align-end-vertical', 'al-right', '⇥')}
        ${btn('align-start-horizontal', 'al-top', '⤒')}${btn('align-center-horizontal', 'al-vcenter', '↕')}${btn('align-end-horizontal', 'al-bottom', '⤓')}</div></div>
      <div class="sec"><div class="toolgrid">
        ${one && one.type !== 'text' && one.type !== 'group' ? btn('flip-horizontal-2', 'flipX', t('flipH')) + btn('flip-vertical-2', 'flipY', t('flipV')) : ''}
        ${els.length > 1 ? btn('group', 'group', t('group')) : ''}${one && one.type === 'group' ? btn('ungroup', 'ungroup', t('ungroup')) : ''}
        ${btn(els.some((x) => x.locked) ? 'lock' : 'lock-open', 'lock', t(els.some((x) => x.locked) ? 'unlock' : 'lock'))}
        ${btn('copy', 'dup', t('duplicate'))}${btn('trash-2', 'del', t('del'))}</div></div>`;
    return h;
  },

  /* ----- clicks inside the panel ----- */
  async onClick(e) {
    const q = (s) => e.target.closest(s);
    let el;
    if ((el = q('[data-tpl]'))) return this.applyTemplate(el.dataset.tpl);
    if ((el = q('[data-add]'))) return this.addText(el.dataset.add);
    if ((el = q('[data-combo]'))) return addEls(scaleCombo(TEXT_COMBOS[+el.dataset.combo].els, Ed.design.width * 0.6));
    if ((el = q('[data-shape]'))) return this.addShape(el.dataset.shape);
    if ((el = q('[data-line]'))) return this.addLine(el.dataset.line.split(',').map(Number));
    if ((el = q('[data-icon]'))) { const s = Math.min(Ed.design.width, Ed.design.height) * 0.25; return addEls([{ type: 'icon', icon: el.dataset.icon, x: 0, y: 0, w: s, h: s, fill: App.brand.colors[0] || '#1F2A44', strokeWidth: 2 }]); }
    if ((el = q('[data-emoji]'))) { const s = Math.min(Ed.design.width, Ed.design.height) * 0.18; return addEls([{ type: 'text', text: el.dataset.emoji, x: 0, y: 0, w: s * 1.4, fontSize: s, fontFamily: 'Cairo', fill: '#000000', align: 'center', lineHeight: 1.2 }]); }
    if ((el = q('[data-updel]'))) { e.stopPropagation(); App.uploads = App.uploads.filter((u) => u.id !== el.dataset.updel); await Store.set('uploads', App.uploads); return this.render(); }
    if ((el = q('[data-up]'))) return this.addImage(App.uploads.find((u) => u.id === el.dataset.up));
    if ((el = q('[data-grad]'))) { const [a, b] = GRADIENTS[+el.dataset.grad]; change(() => { const p = curPage(); p.bg = { ...p.bg, color: a, color2: b, angle: 135 }; }); return this.render(); }
    if ((el = q('[data-bgimg]'))) { const u = App.uploads.find((x) => x.id === el.dataset.bgimg); change(() => { curPage().bg = { ...curPage().bg, image: u.src }; }); return this.render(); }
    if ((el = q('[data-bcdel]'))) { App.brand.colors.splice(+el.dataset.bcdel, 1); await Store.set('brand', App.brand); return this.render(); }
    if ((el = q('[data-layer]'))) {
      const id = el.dataset.layer, la = q('[data-lact]');
      if (!la) return select([id]);
      const a = la.dataset.lact, x = findEl(id);
      if (a === 'hide') change(() => { x.hidden = !x.hidden; });
      if (a === 'lock') { change(() => { x.locked = !x.locked; }); syncTr(); updateCtx(); }
      if (a === 'up' || a === 'down') { const keep = Ed.sel; Ed.sel = [id]; order(a === 'up' ? 'forward' : 'backward'); Ed.sel = keep; }
      return;
    }
    if ((el = q('[data-align]'))) { patchSel({ align: el.dataset.align }); return this.render(); }
    if ((el = q('[data-act]'))) return this.act(el.dataset.act);
  },
  act(a) {
    const one = selEls()[0];
    const toggle = (k) => { patchSel((x) => { x[k] = !one[k]; }); this.render(); };
    const map = {
      upload: () => $('#fileInput').click(),
      bgnone: () => { change(() => { curPage().bg = { ...curPage().bg, image: null }; }); this.render(); },
      font: () => this.fontSheet(one.fontFamily, (f) => patchSel({ fontFamily: f })),
      bold: () => toggle('bold'), italic: () => toggle('italic'), underline: () => toggle('underline'),
      dash: () => toggle('dash'), arrowStart: () => toggle('arrowStart'), arrowEnd: () => toggle('arrowEnd'),
      shadow: () => { patchSel((x) => { x.shadow = one.shadow ? null : { color: '#000000', blur: Math.max(6, (x.fontSize || x.w || 100) / 12), x: 4, y: 6, opacity: 0.35 }; }); this.render(); },
      crop: () => this.cropSheet(one),
      setbg: () => { const src = one.src; change(() => { const p = curPage(); p.bg = { ...p.bg, image: src }; p.elements = p.elements.filter((x) => x.id !== one.id); }); select([]); },
      gray: () => { patchSel((x) => { x.filters = { ...(x.filters || {}), grayscale: !(one.filters || {}).grayscale }; }); this.render(); },
      sepia: () => { patchSel((x) => { x.filters = { ...(x.filters || {}), sepia: !(one.filters || {}).sepia }; }); this.render(); },
      freset: () => { patchSel((x) => { x.filters = null; }); this.render(); },
      front: () => order('front'), back: () => order('back'), forward: () => order('forward'), backward: () => order('backward'),
      flipX: () => flipSel('flipX'), flipY: () => flipSel('flipY'),
      group: groupSel, ungroup: ungroupSel, lock: () => { toggleLock(); this.render(); }, dup: dupSel, del: delSel,
    };
    if (a.startsWith('al-')) return alignSel(a.slice(3));
    if (map[a]) map[a]();
  },

  /* ----- adding things ----- */
  addText(kind) {
    const d = Ed.design, m = Math.min(d.width, d.height), b = App.brand;
    const conf = { h: [0.09, true, b.headingFont, 'defHeading'], s: [0.055, true, b.headingFont, 'defSub'], b: [0.035, false, b.bodyFont, 'defBody'] }[kind];
    addEls([{ type: 'text', text: t(conf[3]), x: 0, y: 0, w: d.width * 0.8, fontSize: Math.round(m * conf[0]), fontFamily: conf[2] || 'Cairo', bold: conf[1], fill: '#1F2A44', align: 'center', lineHeight: 1.25 }]);
  },
  addShape(kind) {
    const d = Ed.design, s = Math.min(d.width, d.height) * 0.35;
    addEls([{ type: 'shape', kind, x: 0, y: 0, w: kind === 'arrow' ? s * 1.4 : s, h: s, fill: App.brand.colors[0] || '#E4572E', stroke: '#1F2A44', strokeWidth: 0, radius: kind === 'rect' ? 0 : undefined }]);
  },
  addLine([dash, a1, a2]) {
    const d = Ed.design;
    addEls([{ type: 'line', x: 0, y: 0, w: d.width * 0.4, stroke: '#1F2A44', strokeWidth: Math.max(4, Math.round(Math.min(d.width, d.height) / 140)), dash: !!dash, arrowStart: !!a1, arrowEnd: !!a2 }]);
  },
  addImage(u) {
    if (!u) return;
    const d = Ed.design, s = Math.min((d.width * 0.6) / u.w, (d.height * 0.6) / u.h);
    addEls([{ type: 'image', src: u.src, x: 0, y: 0, w: u.w * s, h: u.h * s }]);
  },
  applyTemplate(id) {
    const tp = TEMPLATES.find((x) => x.id === id);
    const page = curPage();
    if (page.elements.length && !confirm(t('applyTemplate'))) return;
    const d = Ed.design;
    const pages = tp.pages.map((p) => { const c = clone(p); c.id = uid(); reId(c.elements); return fitPageInto(c, tp.w, tp.h, d.width, d.height); });
    change(() => { d.pages.splice(Ed.pi, 1, ...pages); Ed.sel = []; });
    if (!wide()) this.close();
  },
  async onFiles(files) {
    const added = [];
    for (const f of files) {
      try { const r = await fileToDataURL(f); const u = { id: uid(), ...r }; App.uploads.unshift(u); added.push(u); } catch (e) { console.error(e); }
    }
    await Store.set('uploads', App.uploads);
    if (this.tab === 'uploads' || this.tab === 'background') this.render();
    if (added.length === 1 && this.tab !== 'background') this.addImage(added[0]);
  },

  /* ----- sheets ----- */
  editText(el) {
    const body = openSheet(t('editText'), `<textarea class="field" id="etx" dir="auto" style="min-height:140px;font-size:18px">${esc(el.text)}</textarea><div class="sheet-actions"><button class="btn primary" type="button" id="etxOk">${esc(t('ok'))}</button></div>`, () => { commit(); this.onSelection(); });
    const ta = $('#etx', body);
    ta.oninput = () => { el.text = ta.value; renderPage(); };
    $('#etxOk', body).onclick = closeSheet;
    setTimeout(() => { ta.focus(); ta.select(); }, 50);
  },
  fontSheet(cur, cb) {
    const body = openSheet(t('font'), `<div class="font-list">${FONTS.map((f) => `<button class="font-opt ${f.f === cur ? 'on' : ''}" type="button" data-font="${esc(f.f)}" style="font-family:${esc(fontStack(f.f))}">${esc(f.f)} · ${f.ar ? 'أبجد' : 'Abc'}</button>`).join('')}</div>`);
    body.onclick = async (e) => { const b = e.target.closest('[data-font]'); if (!b) return; await document.fonts.load(`32px "${b.dataset.font}"`, 'Aaع').catch(() => {}); cb(b.dataset.font); closeSheet(); this.render(); };
  },
  cropSheet(el) {
    const c0 = el.crop ? { ...el.crop } : { l: 0, t: 0, r: 0, b: 0 }; const w0 = el.w, h0 = el.h;
    const im = imgReady.get(el.src); if (!im) return;
    const apply = (key) => (v) => {
      const c = { ...(el.crop || { l: 0, t: 0, r: 0, b: 0 }), [key]: v };
      el.crop = c;
      const cw = (1 - c.l - c.r) * im.naturalWidth, ch = (1 - c.t - c.b) * im.naturalHeight;
      el.h = el.w * (ch / cw);
      renderPage();
    };
    const pct = (v) => Math.round(v * 100) + '%';
    const body = openSheet(t('crop'), [['l', 'cropLeft'], ['r', 'cropRight'], ['t', 'cropTop'], ['b', 'cropBottom']].map(([k, l]) => rangeRow(t(l), c0[k], 0, 0.45, 0.01, apply(k), pct).replace('data-rkey', 'data-fmt="pct" data-rkey')).join('')
      + `<div class="sheet-actions"><button class="btn" type="button" id="crReset">${esc(t('reset'))}</button><button class="btn primary" type="button" id="crOk">${esc(t('ok'))}</button></div>`, () => { commit(); this.render(); });
    $('#crOk', body).onclick = closeSheet;
    $('#crReset', body).onclick = () => { el.crop = null; el.w = w0; el.h = (w0 / im.naturalWidth) * im.naturalHeight; renderPage(); closeSheet(); };
    void h0;
  },
  exportSheet() {
    const d = Ed.design, multi = d.pages.length > 1;
    const st = { fmt: 'png', scale: 2, all: multi, transparent: false };
    const dims = (s) => { const r = safeRatio(d.width, d.height, s); return `${Math.round(d.width * r)}×${Math.round(d.height * r)}`; };
    const seg = (name, opts, val) => `<div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${String(v) === String(val) ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>`;
    const body = openSheet(t('download'), `
      <div class="sec"><label>${esc(t('format'))}</label>${seg('fmt', [['png', 'PNG'], ['jpg', 'JPG'], ['pdf', 'PDF']], st.fmt)}</div>
      <div class="sec"><label>${esc(t('quality'))}</label>${seg('scale', [[1, '1×'], [2, '2×'], [3, '3×']], st.scale)}<p class="hint" id="exDims" dir="ltr" style="text-align:start">${dims(2)} px</p></div>
      ${multi ? `<div class="sec"><label>${esc(t('pages'))}</label>${seg('all', [[false, t('currentPage')], [true, t('allPages')]], true)}</div>` : ''}
      <div class="sec" id="exTr"><label class="row nowrap" style="gap:10px;font-weight:600;color:inherit;text-transform:none"><input type="checkbox" id="exTransparent" style="width:22px;height:22px;accent-color:var(--accent)"> ${esc(t('transparent'))}</label></div>
      <div class="sheet-actions"><button class="btn primary" type="button" id="exGo">${icon('download', 20)}${esc(t('download'))}</button></div>`);
    body.onclick = (e) => {
      const b = e.target.closest('[data-seg] button'); if (!b) return;
      const name = b.parentNode.dataset.seg; let v = b.dataset.v; if (name === 'scale') v = +v; if (name === 'all') v = v === 'true';
      st[name] = v; $$('button', b.parentNode).forEach((x) => x.classList.toggle('on', x === b));
      $('#exDims').textContent = dims(st.scale) + ' px'; $('#exTr').classList.toggle('hidden', st.fmt !== 'png');
    };
    $('#exGo', body).onclick = () => { st.transparent = $('#exTransparent').checked; closeSheet(); this.doExport(st); };
  },
  async doExport({ fmt, scale, all, transparent }) {
    const d = Ed.design, pages = all ? d.pages : [curPage()];
    const name = (d.title || 'design').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 60) || 'design';
    toast(t('exporting'), 60000);
    try {
      let files = [];
      if (fmt === 'pdf') {
        const { jsPDF } = window.jspdf; const W = d.width, H = d.height, o = W > H ? 'l' : 'p';
        const pdf = new jsPDF({ orientation: o, unit: 'px', format: [W, H], hotfixes: ['px_scaling'], compress: true });
        for (let i = 0; i < pages.length; i++) {
          if (i) pdf.addPage([W, H], o);
          const c = await renderPageToCanvas(d, pages[i], scale);
          pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, W, H, undefined, 'FAST');
        }
        files = [{ name: name + '.pdf', data: pdf.output('datauristring'), mime: 'application/pdf' }];
      } else {
        for (let i = 0; i < pages.length; i++) {
          const c = await renderPageToCanvas(d, pages[i], scale, fmt === 'png' && transparent);
          const png = fmt === 'png';
          files.push({ name: `${name}${pages.length > 1 ? '-' + (i + 1) : ''}.${png ? 'png' : 'jpg'}`, data: c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.92), mime: png ? 'image/png' : 'image/jpeg' });
        }
      }
      Native.share(files); toast(t('exported'));
    } catch (e) { console.error(e); toast(t('exportFail') + ': ' + e.message, 4000); }
  },
  resizeSheet() {
    const d = Ed.design; let pick = { w: d.width, h: d.height };
    const body = openSheet(t('resize'), `<p class="hint">${esc(t('resizeHint'))}</p>
      <div class="opt-list">${PRESETS.map((p) => `<button class="opt" type="button" data-w="${p.w}" data-h="${p.h}">${esc(tt(p.name))}<small>${p.w} × ${p.h}</small></button>`).join('')}</div>
      <div class="row nowrap" style="margin-top:14px"><input class="field" id="rzW" type="number" inputmode="numeric" value="${d.width}" aria-label="${esc(t('width'))}"><span>×</span><input class="field" id="rzH" type="number" inputmode="numeric" value="${d.height}" aria-label="${esc(t('height'))}"></div>
      <div class="sheet-actions"><button class="btn" type="button" id="rzCopy">${esc(t('resizeCopy'))}</button><button class="btn primary" type="button" id="rzThis">${esc(t('resizeThis'))}</button></div>`);
    body.addEventListener('click', (e) => {
      const o = e.target.closest('.opt'); if (!o) return;
      $$('.opt', body).forEach((x) => x.classList.toggle('on', x === o)); $('#rzW').value = o.dataset.w; $('#rzH').value = o.dataset.h;
    });
    const go = async (copy) => {
      pick = { w: Math.round(+$('#rzW').value), h: Math.round(+$('#rzH').value) };
      const err = sizeError(pick.w, pick.h); if (err) { toast(err); return; }
      closeSheet();
      const src = copy ? clone(Ed.design) : Ed.design;
      const fw = src.width, fh = src.height;
      const apply = () => { src.pages.forEach((p) => fitPageInto(p, fw, fh, pick.w, pick.h)); src.width = pick.w; src.height = pick.h; };
      if (copy) {
        apply(); src.id = uid(); src.title = `${src.title} (${pick.w}×${pick.h})`; src.createdAt = src.updatedAt = Date.now();
        src.pages.forEach((p) => { p.id = uid(); reId(p.elements); });
        await saveNow(); await Store.set('design:' + src.id, src); src.thumb = await pageThumb(src, src.pages[0]); await Home.upsertIndex(src);
        await openDesign(src);
      } else { apply(); fit(); renderPage(); commit(); }
      toast(t('resized'));
    };
    $('#rzCopy', body).onclick = () => go(true);
    $('#rzThis', body).onclick = () => go(false);
  },
  async present() {
    const d = Ed.design, imgs = [];
    toast(t('exporting'), 30000);
    const r = Math.min((innerWidth * devicePixelRatio) / d.width, (innerHeight * devicePixelRatio) / d.height, 2);
    for (const p of d.pages) imgs.push((await renderPageToCanvas(d, p, r)).toDataURL('image/jpeg', 0.9));
    $('#toast').classList.add('hidden');
    let i = Ed.pi; const show = () => { $('#presentImg').src = imgs[i]; $('#presentLabel').textContent = `${i + 1} / ${imgs.length}`; };
    const go = (s) => { i = clamp(i + s, 0, imgs.length - 1); show(); };
    const close = () => { $('#present').classList.add('hidden'); document.removeEventListener('keydown', key); };
    const key = (e) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight' || e.key === ' ') go(1); if (e.key === 'ArrowLeft') go(-1); };
    $('#presentPrev').onclick = () => go(-1); $('#presentNext').onclick = () => go(1); $('#presentImg').onclick = () => go(1); $('#presentClose').onclick = close;
    document.addEventListener('keydown', key);
    $('#present').classList.remove('hidden'); show();
  },
};
function sizeError(w, h) {
  if (!(w > 0 && h > 0) || w < 16 || h < 16) return t('tooSmall');
  if (w > 8000 || h > 8000) return t('tooBig');
  return null;
}

/* text areas in the properties panel: live typing, history on blur */
document.addEventListener('input', (e) => { const k = e.target.dataset && e.target.dataset.tkey; if (k && cbs[k]) cbs[k](e.target.value, false); });
document.addEventListener('change', (e) => { const k = e.target.dataset && e.target.dataset.tkey; if (k && cbs[k]) cbs[k](e.target.value, true); });
/* brand panel inputs */
document.addEventListener('change', async (e) => {
  if (e.target.matches('[data-brandadd]')) { App.brand.colors.push(e.target.value.toUpperCase()); await Store.set('brand', App.brand); Panels.render(); }
  if (e.target.matches('[data-brandfont]')) { App.brand[e.target.dataset.brandfont] = e.target.value; await Store.set('brand', App.brand); }
});
