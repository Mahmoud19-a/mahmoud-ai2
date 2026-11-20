'use strict';
/* Sada: UI, navigation and state. */

let S = null;
const App = { draft: { text: '', image: null }, replyTo: null, dmTyping: {}, generating: false, onPhoto: null, form: {} };
const nav = { stack: [{ v: 'home', p: {} }] };
const cur = () => nav.stack[nav.stack.length - 1];
const saveSoon = debounce(() => Store.set('state', S), 400);
function save() { saveSoon(); }

function freshState() {
  const chars = SEED_CHARACTERS.map((c) => ({ ...c }));
  return {
    me: { name: '', handle: '', bio: '', interests: '', avatar: null, emoji: '🙂' },
    settings: { apiKey: '', model: DEFAULT_MODEL, charImages: true, lang: 'en' },
    chars, followsByMe: chars.slice(0, 16).map((c) => c.id), followsMe: shuffle(chars).slice(0, 3).map((c) => c.id), deletedSeeds: [],
    posts: [], notifs: [], dms: {}, dmRead: {}, queue: [], lastFeedGen: 0, onboarded: false,
  };
}

/* ---------- small renderers ---------- */
const hashN = (s) => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
function avatarURL(c) {
  const prompt = c.avatarPrompt || `candid instagram profile picture of a real person, ${c.name}, ${c.bio}, natural light, iphone photo`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=256&height=256&nologo=true&seed=${hashN(c.id) % 100000}`;
}
function avatar(id, size = 42) {
  const st = `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.5)}px`;
  if (id === 'me') {
    return S.me.avatar ? `<span class="av" style="${st}"><img src="${S.me.avatar}" alt=""></span>`
      : `<span class="av" style="${st};background:#14B8A6">${esc(S.me.emoji || '🙂')}</span>`;
  }
  const c = charById(id) || { id: '?', emoji: '❔', color: '#999', name: '?', bio: '' };
  const img = S.settings.charImages && c.id !== '?' ? `<img src="${avatarURL(c)}" alt="" loading="lazy" onerror="this.remove()">` : '';
  return `<span class="av" style="${st};background:${esc(c.color)}">${esc(c.emoji)}${img}</span>`;
}
const nameOf = (id) => (id === 'me' ? S.me.name || t('you') : (charById(id) || { name: '?' }).name);
const handleOf = (id) => (id === 'me' ? S.me.handle : (charById(id) || { handle: '?' }).handle);
const fakeFollowers = (c) => 120 + (hashN(c.handle) % 4800) + (S.followsByMe.includes(c.id) ? 1 : 0);
const imgURL = (p, w = 1024) => `https://image.pollinations.ai/prompt/${encodeURIComponent(p.imgPrompt)}?width=${w}&height=${w}&nologo=true&seed=${hashN(p.id) % 100000}`;
const hasPhoto = (p) => !!(p.image || (p.imgPrompt && S.settings.charImages));
const photoSrc = (p, w) => p.image || imgURL(p, w);
const GRADS = [['#1e3a8a', '#9333ea'], ['#0f766e', '#22d3ee'], ['#9a3412', '#f59e0b'], ['#831843', '#f43f5e'], ['#14532d', '#84cc16'], ['#312e81', '#ec4899']];
function postCard(p, detail = false) {
  const liked = p.likedByMe, n = p.comments.length, who = p.author;
  const photo = hasPhoto(p);
  const g = GRADS[hashN(p.id) % GRADS.length];
  const media = photo
    ? `<img class="ig-img" src="${photoSrc(p)}" alt="" loading="lazy" onerror="this.outerHTML='<div class=&quot;ig-text&quot; style=&quot;background:linear-gradient(135deg,${g[0]},${g[1]})&quot;>${esc(p.text).replace(/'/g, '&#39;').slice(0, 280)}</div>'">`
    : `<div class="ig-text" style="background:linear-gradient(135deg,${g[0]},${g[1]})">${esc(p.text)}</div>`;
  const liker = p.likers.length ? charById(p.likers[p.likers.length - 1]) : null;
  const likesLine = p.likes ? (liker && p.likes > 1 ? `Liked by <b>${esc(liker.handle)}</b> and <b>${p.likes - 1}</b> others` : `<b>${p.likes}</b> ${t('likes')}`) : '';
  const preview = detail ? [] : p.comments.slice().sort((a, b) => b.at - a.at).slice(0, 2).reverse();
  return `<article class="ig" ${detail ? '' : `data-act="post" data-id="${p.id}"`}>
    <header class="ig-h"><button class="row" data-act="${who === 'me' ? 'tab' : 'char'}" data-v="profile" data-id="${who}">${avatar(who, 34)}<b dir="ltr">${esc(handleOf(who))}</b></button>
      <small class="muted">${ago(p.at)}</small><span class="spacer"></span>
      ${detail && who === 'me' ? `<button class="ib" data-act="delPost" data-id="${p.id}">${icon('trash-2', 18)}</button>` : ''}</header>
    <div class="ig-m">${media}</div>
    <div class="ig-a">
      <button data-act="like" data-id="${p.id}" class="${liked ? 'liked' : ''}">${icon('heart', 25)}</button>
      <button data-act="post" data-id="${p.id}">${icon('message-circle', 25)}</button>
      ${Engine.typingOn(p.id) ? `<span class="typing">${t('typing')}</span>` : ''}
    </div>
    ${likesLine ? `<div class="ig-l">${likesLine}</div>` : ''}
    ${photo && p.text ? `<div class="ig-c"><b dir="ltr">${esc(handleOf(who))}</b> ${esc(p.text)}</div>` : ''}
    ${!detail && n > 2 ? `<button class="ig-more" data-act="post" data-id="${p.id}">View all ${n} comments</button>` : ''}
    ${preview.map((c) => `<div class="ig-c small"><b dir="ltr">${esc(handleOf(c.author))}</b> ${esc(c.text)}</div>`).join('')}
    <div class="ig-t">${ago(p.at)}</div></article>`;
}
function postGrid(posts) {
  if (!posts.length) return `<div class="empty">${t('noPosts')}</div>`;
  return `<div class="grid">${posts.map((p) => {
    const g = GRADS[hashN(p.id) % GRADS.length];
    return hasPhoto(p) ? `<button class="cell" data-act="post" data-id="${p.id}"><img src="${photoSrc(p, 512)}" alt="" loading="lazy" onerror="this.remove()"></button>`
      : `<button class="cell txt" data-act="post" data-id="${p.id}" style="background:linear-gradient(135deg,${g[0]},${g[1]})"><span>${esc(p.text.slice(0, 90))}</span></button>`;
  }).join('')}</div>`;
}

/* ---------- views ---------- */
const V = {};
V.onboard = () => ({
  title: '', tabs: false,
  html: `<div class="hero"><div class="big">🌊</div><h2>${t('welcome')}</h2><p>${t('welcomeSub')}</p></div>${profileForm(true)}`,
});
function profileForm(onboard) {
  const m = S.me;
  return `<div class="form">
    <div class="row">${avatar('me', 64)}<button class="btn small" data-act="pickAvatar">${icon('camera', 18)}${t('choosePhoto')}</button>
      <input class="field" id="fEmoji" style="width:70px;text-align:center" value="${esc(m.emoji || '🙂')}" maxlength="4" aria-label="emoji"></div>
    <div><label>${t('yourName')}</label><input class="field" id="fName" value="${esc(m.name)}" maxlength="40"></div>
    <div><label>${t('yourHandle')}</label><input class="field" id="fHandle" dir="ltr" value="${esc(m.handle)}" maxlength="24" autocapitalize="off" autocorrect="off"></div>
    <div><label>${t('yourBio')}</label><textarea class="field" id="fBio" maxlength="200">${esc(m.bio)}</textarea></div>
    <div><label>${t('interests')}</label><input class="field" id="fInterests" value="${esc(m.interests)}" maxlength="200"></div>
    ${onboard ? `<div><label>${t('apiKey')}</label><input class="field" id="fKey" dir="ltr" type="password" value="${esc(S.settings.apiKey)}" autocapitalize="off" autocorrect="off" placeholder="sk-or-..."><p class="hint">${t('apiKeyHint')}</p></div>` : ''}
    <button class="btn primary" data-act="saveProfile" data-onboard="${onboard ? 1 : ''}">${onboard ? t('start') : t('save')}</button></div>`;
}
V.editProfile = () => ({ title: t('editProfile'), backBtn: true, html: profileForm(false) });

V.home = () => {
  const unreadDM = Object.keys(S.dms).filter(dmUnread).length;
  const right = `<button class="ib" data-act="refresh" aria-label="${t('refresh')}">${App.generating ? `<span class="spin">${icon('refresh-cw', 20)}</span>` : icon('refresh-cw', 20)}</button>
    <button class="ib" data-act="go" data-v="dms" aria-label="${t('messages')}">${icon('send', 21)}${unreadDM ? `<span class="badge">${unreadDM}</span>` : ''}</button>`;
  const posts = S.posts.slice().sort((a, b) => b.at - a.at);
  return {
    title: `<span class="logo">${t('app')}</span>`, right,
    html: `<div class="composer-card">${avatar('me', 38)}<button class="fake" data-act="compose">${t('whatsNew')}</button><button class="ib" data-act="compose" data-photo="1">${icon('image', 22)}</button></div>
      ${App.generating ? `<div class="refresh muted">${t('generating')}</div>` : ''}
      ${posts.length ? posts.map((p) => postCard(p)).join('') : `<div class="empty">${t('noPosts')}<br><br><button class="btn accent" data-act="refresh">${icon('sparkles', 18)}${t('refresh')}</button></div>`}`,
  };
};
V.compose = () => ({
  title: t('post'), backBtn: true,
  right: `<button class="btn accent small" data-act="publish">${t('publish')}</button>`,
  html: `<div class="compose"><div class="row" style="align-items:flex-start">${avatar('me', 40)}<textarea id="draft" data-keep="draft" placeholder="${t('whatsNew')}" dir="auto">${esc(App.draft.text)}</textarea></div>
    ${App.draft.image ? `<div class="preview"><img src="${App.draft.image}" alt=""><button class="ib" data-act="rmPhoto">${icon('x', 20)}</button></div>` : ''}
    <button class="btn small" data-act="pickPhoto">${icon('image', 18)}${t('addPhoto')}</button></div>`,
});
V.post = ({ id }) => {
  const p = S.posts.find((x) => x.id === id);
  if (!p) return { title: '', backBtn: true, html: `<div class="empty">—</div>` };
  const roots = p.comments.filter((c) => !c.parent).sort((a, b) => a.at - b.at);
  const cm = (c, reply) => `<div class="cm ${reply ? 'reply' : ''}"><button data-act="${c.author === 'me' ? 'tab' : 'char'}" data-v="profile" data-id="${c.author}">${avatar(c.author, reply ? 30 : 36)}</button>
    <div class="body"><div class="who"><b>${esc(nameOf(c.author))}</b><small>${ago(c.at)}</small></div><div class="text">${esc(c.text)}</div>
    <div class="actions"><button data-act="likeC" data-post="${p.id}" data-id="${c.id}" class="${c.likedByMe ? 'liked' : ''}">${icon('heart', 15)}<span>${c.likes || ''}</span></button>
    ${c.author !== 'me' ? `<button data-act="reply" data-post="${p.id}" data-id="${c.id}">${icon('reply', 15)}${t('reply')}</button>` : ''}</div></div></div>`;
  return {
    title: t('comments'), backBtn: true, bar: 'comment',
    html: postCard(p, true) + `<div class="comments">${roots.map((r) => cm(r) + p.comments.filter((c) => c.parent === r.id).sort((a, b) => a.at - b.at).map((c) => cm(c, true)).join('')).join('')}</div>`,
  };
};
V.explore = () => {
  const photos = S.posts.filter((p) => p.author !== 'me' && hasPhoto(p)).sort((a, b) => b.at - a.at).slice(0, 30);
  return {
    title: t('explore'),
    html: `<div style="padding:10px 14px"><input class="field" id="search" data-keep="search" type="search" placeholder="Search" autocapitalize="off" autocorrect="off"></div>
      <div id="charList">${S.chars.map((c) => `<div class="list-row" data-q="${esc((c.name + ' ' + c.handle + ' ' + c.bio).toLowerCase())}"><button data-act="char" data-id="${c.id}">${avatar(c.id, 46)}</button>
        <button class="body" data-act="char" data-id="${c.id}" style="text-align:start"><b dir="ltr">${esc(c.handle)}</b><span class="muted">${esc(c.name)} · ${esc(c.bio)}</span></button>
        ${followBtn(c)}</div>`).join('')}</div>
      <div style="padding:12px 14px"><button class="btn accent" style="width:100%" data-act="go" data-v="createChar">${icon('user-plus', 18)}${t('createChar')}</button></div>
      ${photos.length ? `<div class="section-title">Discover</div>${postGrid(photos)}` : ''}`,
  };
};
const followBtn = (c) => S.followsByMe.includes(c.id)
  ? `<button class="btn small" data-act="follow" data-id="${c.id}">${t('following')}</button>`
  : `<button class="btn small primary" data-act="follow" data-id="${c.id}">${t('follow')}</button>`;
V.char = ({ id }) => {
  const c = charById(id); if (!c) return { title: '', backBtn: true, html: '' };
  const posts = S.posts.filter((p) => p.author === id).sort((a, b) => b.at - a.at);
  return {
    title: esc(c.name), backBtn: true,
    html: `<div class="prof">${avatar(id, 76)}<h2>${esc(c.name)}</h2><div class="muted"><span dir="ltr">@${esc(c.handle)}</span> ${S.followsMe.includes(id) ? `· <span>${LANG === 'ar' ? 'يتابعك' : 'follows you'}</span>` : ''}</div>
      <div class="bio">${esc(c.bio)}</div>
      <div class="stats"><span><b>${posts.length}</b> ${t('posts')}</span><span><b>${fakeFollowers(c)}</b> ${t('followers')}</span></div>
      <div class="row">${followBtn(c)}<button class="btn small" data-act="dm" data-id="${id}">${icon('mail', 16)}${t('message')}</button><span class="spacer"></span>
      <button class="ib" data-act="delChar" data-id="${id}" aria-label="${t('deleteChar')}">${icon('trash-2', 18)}</button></div></div>
      ${postGrid(posts)}`,
  };
};
const NOTIF_TEXT = { like: 'nLiked', comment: 'nCommented', reply: 'nReplied', follow: 'nFollowed', dm: 'nMessaged' };
V.notifs = () => ({
  title: t('notifs'),
  html: S.notifs.length ? S.notifs.map((n) => {
    const p = n.post && S.posts.find((x) => x.id === n.post);
    return `<button class="list-row ${n.read ? '' : 'unread'}" data-act="notif" data-id="${n.id}">${avatar(n.who, 42)}
      <span class="body"><span><b>${esc(nameOf(n.who))}</b> ${t(NOTIF_TEXT[n.kind])}</span>${p && p.text ? `<span class="muted">${esc(p.text.slice(0, 80))}</span>` : ''}</span><small class="muted">${ago(n.at)}</small></button>`;
  }).join('') : `<div class="empty">${t('noNotifs')}</div>`,
});
V.profile = () => {
  const posts = S.posts.filter((p) => p.author === 'me').sort((a, b) => b.at - a.at);
  return {
    title: esc(S.me.name), right: `<button class="ib" data-act="go" data-v="settings" aria-label="${t('settings')}">${icon('settings', 22)}</button>`,
    html: `<div class="prof">${avatar('me', 76)}<h2>${esc(S.me.name)}</h2><div class="muted"><span dir="ltr">@${esc(S.me.handle)}</span></div>
      <div class="bio">${esc(S.me.bio)}</div>
      <div class="stats"><span><b>${posts.length}</b> ${t('posts')}</span><span><b>${S.followsMe.length}</b> ${t('followers')}</span><span><b>${S.followsByMe.length}</b> ${t('followingCount')}</span></div>
      <button class="btn small" data-act="go" data-v="editProfile">${t('editProfile')}</button></div>
      ${postGrid(posts)}`,
  };
};
const dmLast = (cid) => { const m = S.dms[cid] || []; return m[m.length - 1]; };
const dmUnread = (cid) => { const l = dmLast(cid); return !!(l && l.from === 'them' && l.at > (S.dmRead[cid] || 0)); };
V.dms = () => {
  const ids = Object.keys(S.dms).filter((k) => (S.dms[k] || []).length && charById(k)).sort((a, b) => dmLast(b).at - dmLast(a).at);
  return {
    title: t('messages'), backBtn: true,
    html: ids.length ? ids.map((cid) => `<button class="list-row ${dmUnread(cid) ? 'unread' : ''}" data-act="dm" data-id="${cid}">${avatar(cid, 46)}
      <span class="body"><b>${esc(nameOf(cid))}</b><span class="muted">${esc(dmLast(cid).text)}</span></span>${dmUnread(cid) ? '<span class="dot"></span>' : `<small class="muted">${ago(dmLast(cid).at)}</small>`}</button>`).join('')
      : `<div class="empty">${t('noMsgs')}</div>`,
  };
};
V.dm = ({ id }) => {
  S.dmRead[id] = Date.now();
  const msgs = S.dms[id] || [];
  return {
    title: `<button class="row" data-act="char" data-id="${id}">${avatar(id, 30)}<span>${esc(nameOf(id))}</span></button>`, backBtn: true, bar: 'dm',
    html: `<div class="chat">${msgs.map((m) => `<div class="bub ${m.from === 'me' ? 'me' : 'them'}">${esc(m.text)}<small>${ago(m.at)}</small></div>`).join('')}
      ${App.dmTyping[id] ? `<div class="bub them typing">${t('typing')}</div>` : ''}</div>`,
  };
};
V.settings = () => {
  const s = S.settings;
  return {
    title: t('settings'), backBtn: true,
    html: `<div class="form">
      <div><label>${t('apiKey')}</label><input class="field" id="sKey" type="password" dir="ltr" value="${esc(s.apiKey)}" autocapitalize="off" autocorrect="off" placeholder="sk-or-..."><p class="hint">${t('apiKeyHint')}</p></div>
      <div><label>${t('model')}</label><input class="field" id="sModel" dir="ltr" list="models" value="${esc(s.model)}" autocapitalize="off" autocorrect="off">
        <datalist id="models">${MODEL_SUGGESTIONS.map((m) => `<option value="${m}">`).join('')}</datalist><p class="hint">${t('modelHint')}</p></div>
      <label class="switch"><input type="checkbox" id="sImg" ${s.charImages ? 'checked' : ''}> <span>${t('charImages')}</span></label><p class="hint" style="margin-top:-8px">${t('charImagesHint')}</p>
      <div><label>${t('language')}</label><div class="chips"><button class="chip ${LANG === 'ar' ? 'on' : ''}" data-act="lang" data-l="ar">العربية</button><button class="chip ${LANG === 'en' ? 'on' : ''}" data-act="lang" data-l="en">English</button></div></div>
      <button class="btn primary" data-act="saveSettings">${t('save')}</button>
      <button class="btn" data-act="export">${icon('download', 18)}${t('exportData')}</button>
      <button class="btn danger" data-act="reset">${icon('trash-2', 18)}${t('resetAll')}</button></div>`,
  };
};
V.createChar = () => {
  const f = App.form;
  return {
    title: t('createChar'), backBtn: true,
    html: `<div class="form">
      <div class="row">${`<span class="av" style="width:64px;height:64px;font-size:32px;background:${f.color}">${esc(f.emoji)}</span>`}<input class="field" id="cEmoji" style="width:80px;text-align:center" value="${esc(f.emoji)}" maxlength="4" aria-label="${t('charEmoji')}"></div>
      <div><label>${t('charColor')}</label><div class="chips">${COLORS.map((c) => `<button class="swatch ${c === f.color ? 'on' : ''}" style="background:${c}" data-act="color" data-c="${c}" aria-label="${c}"></button>`).join('')}</div></div>
      <div><label>${t('charName')}</label><input class="field" id="cName" maxlength="40"></div>
      <div><label>${t('charHandle')}</label><input class="field" id="cHandle" dir="ltr" maxlength="24" autocapitalize="off" autocorrect="off"></div>
      <div><label>${t('charBio')}</label><input class="field" id="cBio" maxlength="160"></div>
      <div><label>${t('charPersonality')}</label><textarea class="field" id="cPers" maxlength="600"></textarea></div>
      <div><label>${t('charLang')}</label><div class="chips">${[['ar', 'langAr'], ['en', 'langEn'], ['both', 'langBoth']].map(([v, l]) => `<button class="chip ${f.lang === v ? 'on' : ''}" data-act="clang" data-l="${v}">${t(l)}</button>`).join('')}</div></div>
      <button class="btn primary" data-act="saveChar">${t('save')}</button></div>`,
  };
};

/* ---------- render ---------- */
const STATIC_VIEWS = new Set(['compose', 'settings', 'editProfile', 'createChar', 'onboard']);
function render(force = false) {
  if (!S) return;
  const c = cur();
  if (!S.onboarded && c.v !== 'onboard') nav.stack = [{ v: 'onboard', p: {} }];
  const { v, p } = cur();
  const view = $('#view');
  if (!force && STATIC_VIEWS.has(v)) { renderTabs(); return; }
  // keep values of fields that survive a re-render, and the scroll position
  const keep = {}; $$('[data-keep]', view).forEach((el) => { keep[el.dataset.keep] = el.value; });
  const sameView = render.last === v + JSON.stringify(p); const top = view.scrollTop;
  const nearBottom = view.scrollHeight - view.scrollTop - view.clientHeight < 80;
  const r = V[v](p || {});
  $('#top').innerHTML = `${r.backBtn ? `<button class="ib flip" data-act="back" aria-label="${t('back')}">${icon('arrow-left', 22)}</button>` : ''}<h1>${r.title || ''}</h1>${r.right || ''}`;
  $('#top').classList.toggle('hidden', v === 'onboard');
  view.innerHTML = r.html;
  $$('[data-keep]', view).forEach((el) => { if (keep[el.dataset.keep] != null) el.value = keep[el.dataset.keep]; });
  if (force || !sameView) renderBar(r.bar);
  if (sameView && !force) view.scrollTop = (v === 'dm' && nearBottom) ? view.scrollHeight : top;
  else view.scrollTop = v === 'dm' ? view.scrollHeight : 0;
  render.last = v + JSON.stringify(p);
  $('#tabs').classList.toggle('hidden', r.tabs === false || !!r.bar);
  renderTabs();
  if (v === 'notifs' && S.notifs.some((n) => !n.read)) setTimeout(() => { S.notifs.forEach((n) => { n.read = true; }); save(); }, 1500);
}
function renderBar(kind) {
  let bar = $('#bar');
  if (!kind) { if (bar) bar.remove(); return; }
  if (!bar) { bar = document.createElement('div'); bar.id = 'bar'; bar.className = 'bar'; $('#app').insertBefore(bar, $('#tabs')); }
  const rt = App.replyTo;
  bar.innerHTML = `<div style="flex:1;display:flex;flex-direction:column;gap:4px">
    ${kind === 'comment' && rt ? `<div class="replying">${t('replyingTo')} <b dir="ltr">@${esc(handleOf(rt.who))}</b><button data-act="cancelReply">${icon('x', 14)}</button></div>` : ''}
    <textarea id="msg" rows="1" dir="auto" placeholder="${kind === 'dm' ? t('typeMsg') : rt ? t('writeReply') : t('writeComment')}"></textarea></div>
    <button class="sendb" data-act="send" data-kind="${kind}" aria-label="${t('send')}">${icon('send', 19)}</button>`;
  bar.style.paddingBottom = `calc(8px + var(--sab))`;
}
function renderTabs() {
  const v = nav.stack[0].v, unread = S.notifs.filter((n) => !n.read).length;
  const b = (id, ic, extra = '') => `<button class="tab ${v === id ? 'on' : ''}" data-act="tab" data-v="${id}" aria-label="${t(id)}">${ic}${extra}</button>`;
  $('#tabs').innerHTML = b('home', icon('house', 24)) + b('explore', icon('compass', 24))
    + `<button class="tab plus" data-act="compose" aria-label="${t('post')}"><span>${icon('plus', 22)}</span></button>`
    + b('notifs', icon('bell', 24), unread ? `<span class="badge">${unread > 99 ? '99+' : unread}</span>` : '') + b('profile', icon('user', 24));
}
function go(v, p = {}) { App.replyTo = null; nav.stack.push({ v, p }); render(true); }
function back() { App.replyTo = null; if (nav.stack.length > 1) nav.stack.pop(); render(true); }
function tab(v) { App.replyTo = null; nav.stack = [{ v, p: {} }]; render(true); }

/* ---------- actions ---------- */
const val = (id) => ($('#' + id) ? $('#' + id).value.trim() : '');
const cleanHandle = (h) => h.replace(/^@/, '').replace(/[^A-Za-z0-9._]/g, '').slice(0, 24);
function aiFail(e) { console.error(e); toast(e.code === 'NO_KEY' ? t('needKey') : e.message, 4500); }

async function refreshFeed(n = 3) {
  if (App.generating) return;
  if (!S.settings.apiKey) { toast(t('needKey')); return; }
  App.generating = true; render();
  try { await Engine.generateFeed(n); } catch (e) { aiFail(e); }
  App.generating = false; render();
}
async function publish() {
  const text = ($('#draft') ? $('#draft').value : App.draft.text).trim();
  if (!text && !App.draft.image) return;
  const post = { id: uid(), author: 'me', text, image: App.draft.image, at: Date.now(), likes: 0, likers: [], likedByMe: false, comments: [] };
  S.posts.unshift(post); App.draft = { text: '', image: null }; save();
  tab('home');
  try { await Engine.reactToMyPost(post); } catch (e) { aiFail(e); }
  render();
}
async function sendComment(text) {
  const p = S.posts.find((x) => x.id === cur().p.id); if (!p) return;
  const rt = App.replyTo;
  let parent = null;
  if (rt) { const tc = p.comments.find((c) => c.id === rt.cid); parent = tc ? (tc.parent || tc.id) : null; }
  const mine = { id: uid(), author: 'me', text, at: Date.now(), parent, likes: 0 };
  p.comments.push(mine); App.replyTo = null; save(); render(true);
  let target = rt ? charById(rt.who) : (p.author !== 'me' ? charById(p.author) : null);
  if (!target) { const commenters = [...new Set(p.comments.filter((c) => c.author !== 'me').map((c) => c.author))]; target = charById(pick(commenters.length ? commenters : S.followsMe.length ? S.followsMe : S.chars.map((c) => c.id))); }
  if (!target) return;
  try { await Engine.replyInThread(p, mine, target); } catch (e) { aiFail(e); }
  render();
}
async function sendDM(text) {
  const id = cur().p.id;
  (S.dms[id] = S.dms[id] || []).push({ id: uid(), from: 'me', text, at: Date.now() });
  S.dmRead[id] = Date.now(); save(); render();
  await new Promise((r) => setTimeout(r, rand(700, 1800)));
  App.dmTyping[id] = true; render();
  try { await Engine.dmReply(id); await new Promise((r) => setTimeout(r, rand(400, 1400))); } catch (e) { aiFail(e); }
  App.dmTyping[id] = false; S.dmRead[id] = cur().v === 'dm' && cur().p.id === id ? Date.now() : S.dmRead[id]; save(); render();
}
function pickPhoto(cb) { App.onPhoto = cb; $('#photoInput').click(); }

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, id = el.dataset.id;
  if (a !== 'post') e.stopPropagation();
  switch (a) {
    case 'tab': if (id === 'me' || !id) tab(el.dataset.v); else tab(el.dataset.v); break;
    case 'go': go(el.dataset.v); if (el.dataset.v === 'createChar') { App.form = { emoji: '🙂', color: pick(COLORS), lang: 'en' }; render(true); } break;
    case 'back': back(); break;
    case 'char': if (id && id !== 'me') go('char', { id }); else tab('profile'); break;
    case 'post': if (cur().v !== 'post' || cur().p.id !== id) go('post', { id }); break;
    case 'like': { const p = S.posts.find((x) => x.id === id); if (p) { p.likedByMe = !p.likedByMe; p.likes += p.likedByMe ? 1 : -1; save(); render(); } break; }
    case 'likeC': { const p = S.posts.find((x) => x.id === el.dataset.post); const c = p && p.comments.find((x) => x.id === id); if (c) { c.likedByMe = !c.likedByMe; c.likes = (c.likes || 0) + (c.likedByMe ? 1 : -1); save(); render(); } break; }
    case 'reply': { const p = S.posts.find((x) => x.id === el.dataset.post); const c = p && p.comments.find((x) => x.id === id); if (c) { App.replyTo = { cid: c.id, who: c.author }; renderBar('comment'); $('#msg').focus(); } break; }
    case 'cancelReply': App.replyTo = null; renderBar('comment'); break;
    case 'send': {
      const ta = $('#msg'); const text = ta.value.trim(); if (!text) return;
      ta.value = '';
      if (el.dataset.kind === 'dm') sendDM(text); else sendComment(text);
      break;
    }
    case 'compose': go('compose'); if (el.dataset.photo) pickPhoto((src) => { App.draft.image = src; render(true); }); break;
    case 'pickPhoto': App.draft.text = val('draft'); pickPhoto((src) => { App.draft.image = src; render(true); }); break;
    case 'rmPhoto': App.draft.text = val('draft'); App.draft.image = null; render(true); break;
    case 'publish': publish(); break;
    case 'refresh': refreshFeed(4); break;
    case 'follow': {
      const i = S.followsByMe.indexOf(id);
      if (i >= 0) S.followsByMe.splice(i, 1); else S.followsByMe.push(id);
      save(); render(); break;
    }
    case 'dm': go('dm', { id }); break;
    case 'notif': {
      const n = S.notifs.find((x) => x.id === id); if (!n) return; n.read = true; save();
      if (n.kind === 'dm') go('dm', { id: n.who }); else if (n.post) go('post', { id: n.post }); else go('char', { id: n.who });
      break;
    }
    case 'delPost': if (confirm(t('confirmDeletePost'))) { S.posts = S.posts.filter((p) => p.id !== id); S.queue = S.queue.filter((q) => q.post !== id); save(); back(); } break;
    case 'delChar': if (confirm(t('confirmDeleteChar'))) {
      S.deletedSeeds = [...(S.deletedSeeds || []), id];
      S.chars = S.chars.filter((c) => c.id !== id); S.posts = S.posts.filter((p) => p.author !== id);
      S.posts.forEach((p) => { p.comments = p.comments.filter((c) => c.author !== id); });
      S.followsByMe = S.followsByMe.filter((x) => x !== id); S.followsMe = S.followsMe.filter((x) => x !== id);
      delete S.dms[id]; S.notifs = S.notifs.filter((n) => n.who !== id); S.queue = S.queue.filter((q) => q.who !== id);
      save(); back();
    } break;
    case 'pickAvatar': pickPhoto(async (src) => { S.me.avatar = await shrinkDataURL(src, 400); save(); render(true); }); break;
    case 'saveProfile': {
      const name = val('fName'), handle = cleanHandle(val('fHandle')) || 'me';
      if (!name) { $('#fName').focus(); return; }
      Object.assign(S.me, { name, handle, bio: val('fBio'), interests: val('fInterests'), emoji: val('fEmoji') || '🙂' });
      if (el.dataset.onboard) {
        S.settings.apiKey = val('fKey'); S.onboarded = true; save(); tab('home');
        if (S.settings.apiKey) refreshFeed(4);
      } else { save(); back(); }
      break;
    }
    case 'saveSettings':
      Object.assign(S.settings, { apiKey: val('sKey'), model: val('sModel') || DEFAULT_MODEL, charImages: $('#sImg').checked });
      save(); toast('✓'); back(); break;
    case 'lang': S.settings.lang = el.dataset.l; setLang(el.dataset.l); save(); render(true); break;
    case 'export': {
      const data = { ...S, settings: { ...S.settings, apiKey: '' } };
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 1))));
      Native.share([{ name: 'sada-backup.json', data: 'data:application/json;base64,' + b64, mime: 'application/json' }]); break;
    }
    case 'reset': if (confirm(t('confirmReset'))) { const keepKey = S.settings; S = freshState(); S.settings = { ...keepKey }; S.onboarded = false; await Store.set('state', S); nav.stack = [{ v: 'onboard', p: {} }]; render(true); } break;
    case 'color': App.form.emoji = val('cEmoji') || App.form.emoji; App.form.color = el.dataset.c; keepCharForm(); break;
    case 'clang': App.form.emoji = val('cEmoji') || App.form.emoji; App.form.lang = el.dataset.l; keepCharForm(); break;
    case 'saveChar': {
      const name = val('cName'), handle = cleanHandle(val('cHandle'));
      if (!name || !handle) { (name ? $('#cHandle') : $('#cName')).focus(); return; }
      if (charByHandle(handle) || handle === S.me.handle) { toast('@' + handle + ' ✗'); return; }
      const c = { id: 'c-' + uid(), name, handle, bio: val('cBio'), personality: val('cPers') || val('cBio'), emoji: val('cEmoji') || '🙂', color: App.form.color, lang: App.form.lang, custom: true };
      S.chars.push(c); S.followsByMe.push(c.id);
      if (Math.random() < 0.8) S.queue.push({ at: Date.now() + rand(15, 90) * 1000, kind: 'follow', who: c.id });
      save(); toast(t('created')); nav.stack = [{ v: 'explore', p: {} }, { v: 'char', p: { id: c.id } }]; render(true);
      if (S.settings.apiKey) { try { await Engine.generateFeed(1, [c]); } catch (err) { aiFail(err); } render(); }
      break;
    }
  }
});
function keepCharForm() {
  const f = ['cName', 'cHandle', 'cBio', 'cPers'].map((k) => [k, val(k)]);
  render(true); f.forEach(([k, v]) => { if ($('#' + k)) $('#' + k).value = v; });
}
document.addEventListener('input', (e) => {
  if (e.target.id === 'draft') App.draft.text = e.target.value;
  if (e.target.id === 'search') { const q = e.target.value.trim().toLowerCase(); $$('#charList .list-row').forEach((r) => { r.style.display = !q || r.dataset.q.includes(q) ? '' : 'none'; }); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'msg' && matchMedia('(pointer: fine)').matches) { e.preventDefault(); $('[data-act="send"]').click(); } });
$('#photoInput').addEventListener('change', async (e) => {
  const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f || !App.onPhoto) return;
  try { App.onPhoto(await fileToDataURL(f)); } catch (err) { toast(err.message); }
});

/* ---------- iPhone notifications for reactions that arrive while the app is closed ---------- */
function scheduleNativeNotifications() {
  const now = Date.now(), items = [];
  S.queue.filter((q) => q.at > now).sort((a, b) => a.at - b.at).forEach((q) => {
    const c = charById(q.who); if (!c) return;
    const post = q.post && S.posts.find((p) => p.id === q.post);
    let body = null;
    if (q.kind === 'like' && post && post.author === 'me') body = `${c.handle} liked your post.`;
    if (q.kind === 'comment' && post && (post.author === 'me' || q.parent)) body = `${c.handle} ${q.parent ? 'replied' : 'commented'}: "${q.text}"`;
    if (q.kind === 'follow') body = `${c.handle} started following you.`;
    if (q.kind === 'dmstart') body = `${c.handle} sent you a message.`;
    if (body) items.push({ id: 'q' + q.at + c.id, title: 'Sada', body, delay: Math.max(1, Math.round((q.at - now) / 1000)) });
  });
  if (items.length) Native.notify({ op: 'schedule', items: items.slice(0, 60) });
}

/* ---------- start ---------- */
(async function main() {
  S = await Store.get('state', null);
  if (!S) S = freshState();
  S = { ...freshState(), ...S };
  // bring in starter characters added in newer versions, and their profile photos
  SEED_CHARACTERS.forEach((sc) => {
    const ex = S.chars.find((c) => c.id === sc.id);
    if (ex) { if (!ex.avatarPrompt) ex.avatarPrompt = sc.avatarPrompt; }
    else if (!(S.deletedSeeds || []).includes(sc.id)) S.chars.push({ ...sc });
  });
  setLang(S.settings.lang || 'en');
  render(true);
  setInterval(() => { if (S.queue.length) Engine.tick(); }, 1000);
  setInterval(() => { if (['home', 'notifs', 'post'].includes(cur().v) && !document.activeElement.matches('textarea,input')) render(); }, 30000);
  if (S.onboarded && S.settings.apiKey && Date.now() - S.lastFeedGen > 45 * 60 * 1000) refreshFeed(4);
  window.__onBackground = () => { saveSoon.flush(); scheduleNativeNotifications(); };
  window.__onForeground = () => { Native.notify({ op: 'clear' }); if (S.queue.length) Engine.tick(); render(); };
  Native.notify({ op: 'clear' });
  document.addEventListener('visibilitychange', () => { if (document.hidden) window.__onBackground(); else window.__onForeground(); });
  window.__ready = true;
})();
