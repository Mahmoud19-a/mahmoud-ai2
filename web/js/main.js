'use strict';
const App = { brand: { colors: [], headingFont: 'Cairo', bodyFont: 'Tajawal' }, uploads: [] };
function showScreen(name) { $('#home').classList.toggle('hidden', name !== 'home'); $('#editor').classList.toggle('hidden', name !== 'editor'); }

(async function main() {
  const settings = await Store.get('settings', { lang: 'ar' });
  App.brand = { ...App.brand, ...(await Store.get('brand', {})) };
  App.uploads = await Store.get('uploads', []);
  await Home.load();
  applyLang(settings.lang);
  Panels.init(); bindEditorUI(); Home.bind(); Home.render();
  $('#langBtn').onclick = async () => {
    settings.lang = LANG === 'ar' ? 'en' : 'ar'; await Store.set('settings', settings);
    applyLang(settings.lang); Panels.init(); Home.render();
  };
  $('#fileInput').onchange = async (e) => { const fs = Array.from(e.target.files || []); e.target.value = ''; if (fs.length) await Panels.onFiles(fs); };
  document.addEventListener('visibilitychange', () => { if (document.hidden && Ed.design) saveSoon.flush(); });
  window.addEventListener('pagehide', () => { if (Ed.design) saveSoon.flush(); });
  window.__ready = true;
})();
