'use strict';
/* OpenRouter client + the "social engine" that makes characters react. */

const AI = {
  async chat(messages, { max = 900, temp = 0.95 } = {}) {
    const s = S.settings;
    if (!s.apiKey) { const e = new Error(t('needKey')); e.code = 'NO_KEY'; throw e; }
    const body = JSON.stringify({ model: s.model || DEFAULT_MODEL, messages, max_tokens: max, temperature: temp });
    const r = await httpPost('https://openrouter.ai/api/v1/chat/completions',
      { Authorization: 'Bearer ' + s.apiKey, 'Content-Type': 'application/json', 'X-Title': 'Sada' }, body);
    let j = null; try { j = JSON.parse(r.text); } catch (e) { /* not JSON */ }
    if (r.status !== 200 || !j || !j.choices) {
      const msg = (j && j.error && (j.error.message || j.error)) || r.text || ('HTTP ' + r.status);
      throw new Error(`${t('aiError')} (${r.status}): ${String(msg).slice(0, 160)}`);
    }
    const c = j.choices[0].message.content;
    return Array.isArray(c) ? c.map((p) => p.text || '').join('') : String(c || '');
  },
  /* Pull the first JSON object out of a model reply. */
  json(text) {
    let s = text.replace(/```(?:json)?/gi, '').trim();
    const a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b < a) throw new Error(t('aiError') + ': no JSON');
    s = s.slice(a, b + 1);
    try { return JSON.parse(s); } catch (e) { return JSON.parse(s.replace(/,\s*([}\]])/g, '$1')); }
  },
};

const langDesc = (l) => (l === 'ar' ? 'writes in Arabic (their own dialect)' : l === 'en' ? 'writes in English' : 'writes in the language of whoever they talk to');
const persona = (c) => `- @${c.handle} (${c.name}). Bio: ${c.bio}. Personality & style: ${c.personality}. Language: ${langDesc(c.lang)}.`;
const charById = (id) => S.chars.find((c) => c.id === id);
const charByHandle = (h) => S.chars.find((c) => c.handle.toLowerCase() === String(h || '').replace(/^@/, '').toLowerCase());
const meDesc = () => `@${S.me.handle} (${S.me.name})${S.me.bio ? ', bio: ' + S.me.bio : ''}${S.me.interests ? ', interests: ' + S.me.interests : ''}`;
const SYSTEM = `You run the characters of "Sada", a social network where every account except ONE human is an AI character.
Write only as the characters, never as an assistant. Sound like real people on social media: short, casual, natural, sometimes emojis, each character in their own voice, dialect and language.
Never say you are an AI or a bot. Never break character. Keep it kind and safe.
When the human writes in Arabic, Arabic-speaking characters answer in their own Arabic dialect; English-only characters answer in English.
Output ONLY the JSON that is asked for. No markdown, no explanations.`;

async function callJSON(content, max = 1000) {
  const txt = await AI.chat([{ role: 'system', content: SYSTEM }, { role: 'user', content }], { max });
  return AI.json(txt);
}
const sec = (a, b) => Date.now() + rand(a, b) * 1000;

const Engine = {
  /* ---------- the human posted ---------- */
  async reactToMyPost(post) {
    const fans = S.chars.filter((c) => S.followsMe.includes(c.id));
    const others = S.chars.filter((c) => !S.followsMe.includes(c.id));
    const chosen = [...shuffle(fans).slice(0, 5), ...shuffle(others).slice(0, 3)].slice(0, Math.min(7, S.chars.length));
    const text = `The human ${meDesc()} just posted:
"""${post.text || '(no text, only a photo)'}"""${post.image ? '\nThe attached image is the photo in the post. React to what is actually in it.' : ''}

These characters see the post:
${chosen.map(persona).join('\n')}

For each character decide if they like it, and optionally write a comment (1–2 sentences, in their voice). About 60% should comment.
Make the comments varied: questions, jokes, compliments, opinions, personal stories. Talk to the human directly.
Return JSON: {"reactions":[{"handle":"handle","like":true,"comment":"text or empty string"}]}`;
    let content = text;
    if (post.image) { const small = await shrinkDataURL(post.image); if (small) content = [{ type: 'text', text }, { type: 'image_url', image_url: { url: small } }]; }
    const j = await callJSON(content);
    (j.reactions || []).forEach((r) => {
      const c = charByHandle(r.handle); if (!c) return;
      if (r.like) S.queue.push({ at: sec(3, 70), kind: 'like', post: post.id, who: c.id });
      if (r.comment && String(r.comment).trim()) S.queue.push({ at: sec(8, 150), kind: 'comment', post: post.id, who: c.id, text: String(r.comment).trim() });
    });
    // a couple of new followers now and then
    shuffle(others).slice(0, randi(0, 2)).forEach((c) => {
      if (Math.random() < 0.6) {
        S.queue.push({ at: sec(20, 240), kind: 'follow', who: c.id });
        if (Math.random() < 0.35) S.queue.push({ at: sec(120, 600), kind: 'dmstart', who: c.id });
      }
    });
    save();
  },

  /* ---------- the human commented or replied in a thread ---------- */
  async replyInThread(post, mine, target) {
    const root = mine.parent ? post.comments.find((c) => c.id === mine.parent) : mine;
    const thread = post.comments.filter((c) => c.id === root.id || c.parent === root.id).sort((a, b) => a.at - b.at);
    const name = (id) => (id === 'me' ? '@' + S.me.handle + ' (the human)' : '@' + (charById(id) || {}).handle);
    const author = post.author === 'me' ? `the human ${meDesc()}` : name(post.author);
    const extras = shuffle(S.chars.filter((c) => c.id !== target.id)).slice(0, 3);
    const text = `Post by ${author}:
"""${post.text || '(photo)'}"""

Comment thread so far:
${thread.map((c) => `${name(c.author)}: ${c.text}`).join('\n')}

The human just wrote the last message. Write the reply of this character (required):
${persona(target)}
Optionally ONE of these characters may also join with a short reply (only if natural, maybe 30% of the time):
${extras.map(persona).join('\n')}

Return JSON: {"replies":[{"handle":"${target.handle}","text":"..."}]}`;
    const j = await callJSON(text, 600);
    (j.replies || []).forEach((r, i) => {
      const c = charByHandle(r.handle); if (!c || !r.text) return;
      S.queue.push({ at: sec(i ? 25 : 5, i ? 90 : 35), kind: 'comment', post: post.id, who: c.id, text: String(r.text).trim(), parent: root.id, likeMine: mine.id });
    });
    save();
  },

  /* ---------- new posts from characters ---------- */
  async generateFeed(n = 3, only = null) {
    const authors = only || shuffle(S.chars).slice(0, Math.min(n, S.chars.length));
    const myLast = S.posts.filter((p) => p.author === 'me').slice(0, 2).map((p) => p.text).filter(Boolean);
    const text = `Write ONE new social media post for each of these characters:
${authors.map(persona).join('\n')}

Posts can be about their day, their interests, an opinion, something funny, a question to followers. Make them feel alive and different.
${myLast.length ? `Sometimes (not always) a character may mention the human @${S.me.handle}, whose recent posts were: ${myLast.map((x) => '"' + x.slice(0, 120) + '"').join(', ')}.` : ''}
Each post may get 0–2 short comments from OTHER characters, chosen from: ${S.chars.map((c) => '@' + c.handle).join(', ')}.
If a photo fits the post, add "image": a short English description of the photo (scenery, food, objects, places; no close-up faces). Otherwise "image": "".
Return JSON: {"posts":[{"handle":"...","text":"...","image":"...","comments":[{"handle":"...","text":"..."}]}]}`;
    const j = await callJSON(text, 1400);
    const now = Date.now();
    (j.posts || []).forEach((p, i) => {
      const c = charByHandle(p.handle); if (!c || !p.text) return;
      const at = now - i * randi(60, 900) * 1000;
      const likers = shuffle(S.chars.filter((x) => x.id !== c.id)).slice(0, randi(1, 5)).map((x) => x.id);
      const post = { id: uid(), author: c.id, text: String(p.text).trim(), imgPrompt: p.image || '', at, likes: randi(4, 380) + likers.length, likers, likedByMe: false, comments: [] };
      (p.comments || []).forEach((cm, k) => { const w = charByHandle(cm.handle); if (w && cm.text && w.id !== c.id) post.comments.push({ id: uid(), author: w.id, text: String(cm.text).trim(), at: at + (k + 1) * randi(60, 600) * 1000, parent: null, likes: randi(0, 20) }); });
      S.posts.push(post);
    });
    S.posts.sort((a, b) => b.at - a.at);
    S.lastFeedGen = now; save();
  },

  /* ---------- direct messages ---------- */
  async dmReply(cid, start = false) {
    const c = charById(cid); if (!c) return;
    const hist = (S.dms[cid] || []).slice(-30).map((m) => ({ role: m.from === 'me' ? 'user' : 'assistant', content: m.text }));
    const sys = `You are ${c.name} (@${c.handle}) on the social network Sada, chatting in private messages with ${meDesc()}.
Bio: ${c.bio}. Personality & style: ${c.personality}. Language: ${langDesc(c.lang)}.
Stay fully in character as a real person. Never say you are an AI. Write like a text message: short and natural, 1–3 sentences. Reply with the message text only.`;
    const messages = [{ role: 'system', content: sys }, ...hist];
    if (start) messages.push({ role: 'user', content: '(You just followed this person. Send them a short friendly first message about something from their profile or posts. Only the message text.)' });
    const txt = (await AI.chat(messages, { max: 300 })).trim().replace(/^"|"$/g, '');
    if (!txt) return;
    (S.dms[cid] = S.dms[cid] || []).push({ id: uid(), from: 'them', text: txt, at: Date.now() });
    if (start) notify('dm', cid);
    save();
  },

  /* ---------- the scheduler: apply reactions when they are due ---------- */
  ticking: false,
  async tick() {
    if (this.ticking) return; this.ticking = true;
    try {
      const now = Date.now(), due = S.queue.filter((q) => q.at <= now);
      if (!due.length) return;
      S.queue = S.queue.filter((q) => q.at > now);
      for (const q of due.sort((a, b) => a.at - b.at)) {
        const post = q.post && S.posts.find((p) => p.id === q.post);
        if (q.kind === 'like' && post && !post.likers.includes(q.who)) { post.likers.push(q.who); post.likes++; if (post.author === 'me') notify('like', q.who, post.id); }
        if (q.kind === 'comment' && post) {
          post.comments.push({ id: uid(), author: q.who, text: q.text, at: Date.now(), parent: q.parent || null, likes: 0 });
          if (q.likeMine) { const m = post.comments.find((x) => x.id === q.likeMine); if (m) m.likes = (m.likes || 0) + 1; }
          if (post.author === 'me' || q.parent) notify(q.parent ? 'reply' : 'comment', q.who, post.id);
        }
        if (q.kind === 'follow' && !S.followsMe.includes(q.who)) { S.followsMe.push(q.who); notify('follow', q.who); }
        if (q.kind === 'dmstart' && !(S.dms[q.who] || []).length) this.dmReply(q.who, true).then(render).catch(() => {});
      }
      save(); render();
    } finally { this.ticking = false; }
  },
  typingOn(postId) { const soon = Date.now() + 25000; return S.queue.some((q) => q.post === postId && q.kind === 'comment' && q.at < soon); },
};

function notify(kind, who, post) { S.notifs.unshift({ id: uid(), kind, who, post: post || null, at: Date.now(), read: false }); S.notifs = S.notifs.slice(0, 300); }
