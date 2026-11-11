'use strict';
/* Home screen: presets, saved designs, templates. */
const DPI = 150; // mm / inch conversion for custom sizes (A4 = 1240 × 1754)
const Home = {
  index: [], cat: 'all', thumbs: new Map(), queue: Promise.resolve(),

  async load() { this.index = await Store.get('index', []); },
  async upsertIndex(d) {
    const m = { id: d.id, title: d.title, width: d.width, height: d.height, updatedAt: d.updatedAt, thumb: d.thumb };
    const i = this.index.findIndex((x) => x.id === d.id);
    if (i >= 0) this.index[i] = m; else this.index.unshift(m);
    this.index.sort((a, b) => b.updatedAt - a.updatedAt);
    await Store.set('index', this.index);
  },
  tplThumb(tp) {
    if (!this.thumbs.has(tp.id)) {
      const p = this.queue.then(() => pageThumb({ width: tp.w, height: tp.h }, tp.pages[0], 360)).catch(() => '');
      this.queue = p; this.thumbs.set(tp.id, p);
    }
    return this.thumbs.get(tp.id);
  },
  fillThumbs(root) {
    $$('img[data-thumb]', root).forEach(async (img) => { const tp = TEMPLATES.find((x) => x.id === img.dataset.thumb); if (tp) img.src = await this.tplThumb(tp); });
  },

  render() {
    const box = (w, h) => { const s = 56 / Math.max(w, h); return `<i style="width:${Math.round(w * s)}px;height:${Math.round(h * s)}px"></i>`; };
    $('#presetRow').innerHTML = PRESETS.map((p) => `<button class="preset" type="button" data-preset="${p.id}"><div class="box">${box(p.w, p.h)}</div>${esc(tt(p.name))}<small>${p.w} × ${p.h}</small></button>`).join('')
      + `<button class="preset" type="button" data-custom="1"><div class="box">${icon('plus', 32)}</div>${esc(t('custom'))}<small>px · mm · in</small></button>`;
    const fmtDate = (ms) => new Date(ms).toLocaleDateString(LANG === 'ar' ? 'ar' : 'en', { day: 'numeric', month: 'short' });
    $('#recentGrid').innerHTML = this.index.length ? this.index.map((d) => `<div class="card" data-open="${d.id}" role="button" tabindex="0">
        <div class="thumb">${d.thumb ? `<img src="${d.thumb}" alt="">` : ''}</div>
        <div class="meta"><b>${esc(d.title)}</b><small dir="ltr">${d.width}×${d.height} · ${esc(fmtDate(d.updatedAt))}</small></div>
        <button class="icon-btn more" type="button" data-menu="${d.id}" aria-label="menu">${icon('more-horizontal', 20)}</button></div>`).join('')
      : `<div class="empty">${esc(t('noDesigns'))}</div>`;
    const cats = ['all', 'social', 'story', 'presentation', 'print', 'thumbnail'];
    $('#tplCats').innerHTML = cats.map((c) => `<button class="chip ${c === this.cat ? 'on' : ''}" type="button" data-cat="${c}">${esc(t(c))}</button>`).join('');
    $('#tplGrid').innerHTML = TEMPLATES.filter((tp) => this.cat === 'all' || tp.cat === this.cat).map((tp) => `<button class="card" type="button" data-tpl="${tp.id}">
        <div class="thumb"><img data-thumb="${tp.id}" alt=""></div><div class="meta"><b>${esc(tt(tp.title))}</b><small dir="ltr">${tp.w}×${tp.h}${tp.pages.length > 1 ? ' · ' + tp.pages.length + 'p' : ''}</small></div></button>`).join('');
    this.fillThumbs($('#tplGrid'));
  },

  bind() {
    $('#home').addEventListener('click', async (e) => {
      const q = (s) => e.target.closest(s); let el;
      if ((el = q('[data-menu]'))) { e.stopPropagation(); return this.menu(el.dataset.menu); }
      if ((el = q('[data-open]'))) return this.open(el.dataset.open);
      if ((el = q('[data-preset]'))) { const p = PRESETS.find((x) => x.id === el.dataset.preset); return this.create(p.w, p.h, tt(p.name)); }
      if (q('[data-custom]')) return this.customSheet();
      if ((el = q('[data-cat]'))) { this.cat = el.dataset.cat; return this.render(); }
      if ((el = q('[data-tpl]'))) return this.fromTemplate(TEMPLATES.find((x) => x.id === el.dataset.tpl));
    });
    $('#newBtn').onclick = () => this.customSheet();
  },

  async create(w, h, title, pages) {
    const now = Date.now();
    const d = { id: uid(), title: title || t('untitled'), width: w, height: h, createdAt: now, updatedAt: now,
      pages: pages || [{ id: uid(), bg: { color: '#FFFFFF' }, elements: [] }] };
    await Store.set('design:' + d.id, d);
    try { d.thumb = await pageThumb(d, d.pages[0]); } catch (e) { /* ignore */ }
    await this.upsertIndex(d);
    await openDesign(d);
  },
  fromTemplate(tp) {
    const pages = tp.pages.map((p) => { const c = clone(p); c.id = uid(); reId(c.elements); return c; });
    return this.create(tp.w, tp.h, tt(tp.title), pages);
  },
  async open(id) {
    const d = await Store.get('design:' + id);
    if (!d) { this.index = this.index.filter((x) => x.id !== id); await Store.set('index', this.index); return this.render(); }
    await openDesign(d);
  },
  menu(id) {
    const m = this.index.find((x) => x.id === id); if (!m) return;
    const body = openSheet(m.title, `<div class="sec"><label>${esc(t('rename'))}</label><input class="field" id="mnName" value="${esc(m.title)}" maxlength="80"></div>
      <div class="sheet-actions"><button class="btn" type="button" id="mnDup">${icon('copy', 18)}${esc(t('duplicate'))}</button><button class="btn danger" type="button" id="mnDel">${icon('trash-2', 18)}${esc(t('del'))}</button></div>
      <div class="sheet-actions"><button class="btn primary" type="button" id="mnOk">${esc(t('ok'))}</button></div>`);
    $('#mnOk', body).onclick = async () => {
      const name = $('#mnName').value.trim() || t('untitled');
      const d = await Store.get('design:' + id); if (d) { d.title = name; await Store.set('design:' + id, d); }
      m.title = name; await Store.set('index', this.index); closeSheet(); this.render();
    };
    $('#mnDup', body).onclick = async () => {
      const d = await Store.get('design:' + id); if (!d) return;
      d.id = uid(); d.title = d.title + ' 2'; d.createdAt = d.updatedAt = Date.now(); d.pages.forEach((p) => { p.id = uid(); reId(p.elements); });
      await Store.set('design:' + d.id, d); await this.upsertIndex(d); closeSheet(); this.render();
    };
    $('#mnDel', body).onclick = async () => {
      if (!confirm(t('confirmDelete'))) return;
      await Store.del('design:' + id); this.index = this.index.filter((x) => x.id !== id); await Store.set('index', this.index); closeSheet(); this.render();
    };
  },
  customSheet() {
    const body = openSheet(t('custom'), `<div class="row nowrap"><div style="flex:1"><label class="hint">${esc(t('width'))}</label><input class="field" id="csW" type="number" inputmode="decimal" value="1080"></div>
      <div style="flex:1"><label class="hint">${esc(t('height'))}</label><input class="field" id="csH" type="number" inputmode="decimal" value="1080"></div>
      <div style="flex:1"><label class="hint">${esc(t('unit'))}</label><select class="field" id="csU"><option value="px">px</option><option value="mm">mm</option><option value="in">in</option></select></div></div>
      <div class="sheet-actions"><button class="btn primary" type="button" id="csGo">${esc(t('create'))}</button></div>`);
    $('#csGo', body).onclick = () => {
      const u = $('#csU').value, k = u === 'mm' ? DPI / 25.4 : u === 'in' ? DPI : 1;
      const w = Math.round(+$('#csW').value * k), h = Math.round(+$('#csH').value * k);
      const err = sizeError(w, h); if (err) { toast(err); return; }
      closeSheet(); this.create(w, h);
    };
  },
};
