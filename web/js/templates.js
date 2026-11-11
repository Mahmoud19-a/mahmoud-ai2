'use strict';
/* Original starter templates and size presets. All content here is our own. */

const PRESETS = [
  { id: 'ig', name: { ar: 'منشور انستغرام', en: 'Instagram post' }, w: 1080, h: 1080 },
  { id: 'story', name: { ar: 'ستوري', en: 'Story' }, w: 1080, h: 1920 },
  { id: 'igp', name: { ar: 'منشور طولي', en: 'Portrait post' }, w: 1080, h: 1350 },
  { id: 'fb', name: { ar: 'منشور فيسبوك', en: 'Facebook post' }, w: 1200, h: 630 },
  { id: 'yt', name: { ar: 'صورة يوتيوب', en: 'YouTube thumbnail' }, w: 1280, h: 720 },
  { id: 'pres', name: { ar: 'عرض تقديمي', en: 'Presentation' }, w: 1920, h: 1080 },
  { id: 'a4', name: { ar: 'A4 / فلاير', en: 'A4 flyer' }, w: 1240, h: 1754 },
  { id: 'card', name: { ar: 'بطاقة عمل', en: 'Business card' }, w: 1050, h: 600 },
  { id: 'logo', name: { ar: 'شعار', en: 'Logo' }, w: 800, h: 800 },
  { id: 'x', name: { ar: 'منشور X', en: 'X post' }, w: 1600, h: 900 },
];

const TX = (text, x, y, w, fontSize, o = {}) => ({ type: 'text', text, x, y, w, fontSize, fontFamily: 'Cairo', fill: '#1F2A44', align: 'center', lineHeight: 1.2, ...o });
const SH = (kind, x, y, w, h, fill, o = {}) => ({ type: 'shape', kind, x, y, w, h, fill, stroke: '#1F2A44', strokeWidth: 0, ...o });
const IC = (name, x, y, s, fill, o = {}) => ({ type: 'icon', icon: name, x, y, w: s, h: s, fill, strokeWidth: 2, ...o });
const LN = (x, y, w, stroke, strokeWidth, o = {}) => ({ type: 'line', x, y, w, stroke, strokeWidth, ...o });

const TEMPLATES = [
  { id: 't-sale', cat: 'social', title: { ar: 'تخفيضات', en: 'Big sale' }, w: 1080, h: 1080, pages: [{ bg: { color: '#E4572E', color2: '#F2A541', angle: 120 }, elements: [
    SH('ellipse', 190, 170, 700, 700, '#FFFFFF', { opacity: 0.14 }),
    SH('star', 760, 80, 220, 220, '#FFE8A3'),
    TX('تخفيضات', 90, 250, 900, 150, { fontFamily: 'Lalezar', fill: '#FFFFFF' }),
    TX('حتى 50%', 90, 440, 900, 190, { fontFamily: 'Lalezar', fill: '#1F2A44' }),
    SH('roundrect', 340, 760, 400, 110, '#1F2A44'),
    TX('تسوّق الآن', 340, 783, 400, 50, { fill: '#FFFFFF', bold: true }),
    TX('لفترة محدودة فقط', 90, 920, 900, 40, { fill: '#FFFFFF' }),
  ] }] },
  { id: 't-quote', cat: 'social', title: { ar: 'اقتباس', en: 'Quote' }, w: 1080, h: 1080, pages: [{ bg: { color: '#1F2A44' }, elements: [
    IC('quote', 450, 140, 180, '#F2A541', { strokeWidth: 1.5 }),
    TX('العلم في الصغر\nكالنقش على الحجر', 90, 380, 900, 90, { fontFamily: 'Amiri', fill: '#FFFFFF', bold: true, lineHeight: 1.4 }),
    LN(440, 730, 200, '#F2A541', 6),
    TX('مثل عربي', 90, 770, 900, 44, { fill: '#C9CFDB' }),
  ] }] },
  { id: 't-event', cat: 'social', title: { ar: 'ورشة عمل', en: 'Workshop' }, w: 1080, h: 1080, pages: [{ bg: { color: '#FAF7F2' }, elements: [
    SH('rect', 0, 0, 1080, 360, '#2A6F97'),
    SH('ellipse', 820, -120, 400, 400, '#61A5C2', { opacity: 0.6 }),
    TX('ورشة تصميم مجانية', 60, 100, 960, 92, { fontFamily: 'Changa', fill: '#FFFFFF', bold: true }),
    TX('تعلّم أساسيات التصميم في ساعتين', 60, 230, 960, 46, { fill: '#E3F1F8' }),
    IC('calendar', 760, 470, 90, '#2A6F97'), TX('السبت ١٥ نوفمبر', 160, 485, 560, 52, { align: 'right', bold: true }),
    IC('clock', 760, 610, 90, '#2A6F97'), TX('٦:٠٠ مساءً', 160, 625, 560, 52, { align: 'right', bold: true }),
    IC('map-pin', 760, 750, 90, '#2A6F97'), TX('المكتبة العامة، القاعة ٣', 160, 765, 560, 52, { align: 'right', bold: true }),
    SH('roundrect', 340, 930, 400, 100, '#E4572E'), TX('سجّل الآن', 340, 950, 400, 50, { fill: '#FFFFFF', bold: true }),
  ] }] },
  { id: 't-food', cat: 'social', title: { ar: 'مطعم', en: 'Restaurant' }, w: 1080, h: 1350, pages: [{ bg: { color: '#2D3B2D' }, elements: [
    SH('ellipse', 240, 330, 600, 600, '#F4E9D8'), IC('pizza', 390, 480, 300, '#C0392B', { strokeWidth: 1.4 }),
    TX('بيتزا الجمعة', 60, 90, 960, 120, { fontFamily: 'Lalezar', fill: '#F4E9D8' }),
    TX('اطلب واحدة واحصل على الثانية مجاناً', 60, 990, 960, 52, { fill: '#F4E9D8', bold: true }),
    SH('roundrect', 300, 1120, 480, 110, '#F2A541'), TX('اطلب الآن', 300, 1140, 480, 52, { fill: '#2D3B2D', bold: true }),
  ] }] },
  { id: 't-story-new', cat: 'story', title: { ar: 'وصل حديثاً', en: 'New arrival' }, w: 1080, h: 1920, pages: [{ bg: { color: '#F6D6C7', color2: '#E4572E', angle: 90 }, elements: [
    TX('NEW', 80, 180, 920, 260, { fontFamily: 'Bebas Neue', fill: '#FFFFFF' }),
    TX('وصل حديثاً', 80, 470, 920, 110, { fontFamily: 'Lalezar', fill: '#1F2A44' }),
    SH('roundrect', 190, 680, 700, 760, '#FFFFFF', { radius: 40, opacity: 0.9 }),
    IC('shopping-bag', 340, 820, 400, '#E4572E', { strokeWidth: 1.3 }),
    TX('مجموعة الشتاء متوفرة الآن', 80, 1520, 920, 60, { fill: '#FFFFFF', bold: true }),
    IC('arrow-up', 490, 1700, 100, '#FFFFFF'),
  ] }] },
  { id: 't-story-tips', cat: 'story', title: { ar: 'نصائح', en: 'Tips list' }, w: 1080, h: 1920, pages: [{ bg: { color: '#FFF8EC' }, elements: [
    SH('rect', 0, 0, 1080, 520, '#1F2A44'),
    TX('٥ نصائح\nلنوم أفضل', 80, 140, 920, 120, { fontFamily: 'Changa', fill: '#FFFFFF', bold: true }),
    ...['أطفئ الشاشات قبل النوم بساعة', 'نَم واستيقظ في نفس الوقت', 'خفّف الكافيين بعد العصر', 'اجعل غرفتك مظلمة وباردة', 'تحرّك ٣٠ دقيقة كل يوم'].flatMap((s, i) => [
      SH('ellipse', 870, 640 + i * 230, 120, 120, '#E4572E'),
      TX(String(i + 1).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]), 870, 660 + i * 230, 120, 64, { fill: '#FFFFFF', bold: true }),
      TX(s, 80, 670 + i * 230, 760, 54, { align: 'right' }),
    ]),
  ] }] },
  { id: 't-yt', cat: 'thumbnail', title: { ar: 'يوتيوب', en: 'YouTube' }, w: 1280, h: 720, pages: [{ bg: { color: '#111827' }, elements: [
    SH('rect', 0, 0, 560, 720, '#FACC15'),
    IC('rocket', 100, 180, 360, '#111827', { strokeWidth: 1.6 }),
    TX('كيف تبدأ\nمشروعك؟', 600, 150, 640, 120, { fontFamily: 'Lalezar', fill: '#FFFFFF', align: 'right', lineHeight: 1.15 }),
    SH('roundrect', 840, 520, 400, 100, '#E4572E'), TX('دليل كامل', 840, 538, 400, 54, { fill: '#FFFFFF', bold: true }),
  ] }] },
  { id: 't-pres', cat: 'presentation', title: { ar: 'عرض تقديمي', en: 'Pitch deck' }, w: 1920, h: 1080, pages: [
    { bg: { color: '#1F2A44' }, elements: [
      SH('ellipse', 1300, -300, 900, 900, '#E4572E', { opacity: 0.9 }),
      SH('ellipse', 1550, 650, 500, 500, '#F2A541', { opacity: 0.8 }),
      TX('اسم مشروعك', 120, 380, 1100, 150, { fontFamily: 'Changa', fill: '#FFFFFF', bold: true, align: 'right' }),
      TX('جملة واحدة تشرح ماذا تفعل ولمن', 120, 580, 1100, 60, { fill: '#C9CFDB', align: 'right' }),
    ] },
    { bg: { color: '#FAF7F2' }, elements: [
      TX('المشكلة', 120, 110, 1680, 96, { fontFamily: 'Changa', bold: true, align: 'right' }),
      LN(1500, 240, 300, '#E4572E', 10),
      ...[['users', 'من يعاني منها؟'], ['clock', 'كم تكلّفهم من وقت؟'], ['credit-card', 'كم تكلّفهم من مال؟']].flatMap(([ic, s], i) => [
        SH('roundrect', 1300 - i * 560, 380, 500, 520, '#FFFFFF', { stroke: '#E7E1D8', strokeWidth: 3 }),
        IC(ic, 1460 - i * 560, 450, 180, '#E4572E'),
        TX(s, 1330 - i * 560, 700, 440, 52, { bold: true }),
      ]),
    ] },
  ] },
  { id: 't-flyer', cat: 'print', title: { ar: 'فلاير', en: 'Flyer' }, w: 1240, h: 1754, pages: [{ bg: { color: '#FFFFFF' }, elements: [
    SH('rect', 0, 0, 1240, 760, '#2A9D8F'),
    SH('triangle', 0, 560, 1240, 400, '#FFFFFF', { flipY: true }),
    TX('افتتاح\nالفرع الجديد', 80, 160, 1080, 150, { fontFamily: 'Lalezar', fill: '#FFFFFF', lineHeight: 1.1 }),
    TX('هدايا لأول ١٠٠ زائر', 80, 1000, 1080, 80, { bold: true, fill: '#2A9D8F' }),
    TX('انضموا إلينا يوم الجمعة من الساعة ١٠ صباحاً حتى ١٠ مساءً. خصومات على كل شيء، ومسابقات للأطفال.', 140, 1130, 960, 46, { lineHeight: 1.6, fill: '#5E6573' }),
    LN(120, 1500, 1000, '#E7E1D8', 4),
    IC('phone', 1000, 1560, 80, '#2A9D8F'), TX('0790 000 000', 520, 1570, 460, 50, { align: 'right', fontFamily: 'Montserrat', bold: true }),
  ] }] },
  { id: 't-card', cat: 'print', title: { ar: 'بطاقة عمل', en: 'Business card' }, w: 1050, h: 600, pages: [
    { bg: { color: '#1F2A44' }, elements: [
      SH('rect', 0, 0, 24, 600, '#E4572E'),
      TX('سارة أحمد', 80, 200, 890, 84, { fontFamily: 'Changa', fill: '#FFFFFF', bold: true, align: 'right' }),
      TX('مصممة جرافيك', 80, 310, 890, 44, { fill: '#F2A541', align: 'right' }),
    ] },
    { bg: { color: '#FFFFFF' }, elements: [
      IC('phone', 880, 140, 60, '#E4572E'), TX('0790 000 000', 300, 145, 560, 40, { align: 'right', fontFamily: 'Montserrat' }),
      IC('mail', 880, 270, 60, '#E4572E'), TX('sara@example.com', 300, 275, 560, 40, { align: 'right', fontFamily: 'Montserrat' }),
      IC('globe', 880, 400, 60, '#E4572E'), TX('example.com', 300, 405, 560, 40, { align: 'right', fontFamily: 'Montserrat' }),
    ] },
  ] },
  { id: 't-invite', cat: 'print', title: { ar: 'دعوة', en: 'Invitation' }, w: 1240, h: 1754, pages: [{ bg: { color: '#FBF5EC' }, elements: [
    SH('rect', 60, 60, 1120, 1634, '', { stroke: '#B08D57', strokeWidth: 6 }),
    SH('rect', 90, 90, 1060, 1574, '', { stroke: '#B08D57', strokeWidth: 2 }),
    IC('flower-2', 520, 180, 200, '#B08D57', { strokeWidth: 1.2 }),
    TX('بكل الحب ندعوكم\nلحضور حفل زفاف', 120, 450, 1000, 64, { fontFamily: 'Amiri', fill: '#6B4F2A', lineHeight: 1.5 }),
    TX('محمد & ليلى', 120, 720, 1000, 150, { fontFamily: 'Reem Kufi', fill: '#B08D57', bold: true }),
    LN(470, 960, 300, '#B08D57', 3),
    TX('الخميس ٢٠ مارس\nالساعة الثامنة مساءً\nقاعة الياسمين', 120, 1030, 1000, 56, { fontFamily: 'Amiri', fill: '#6B4F2A', lineHeight: 1.6 }),
  ] }] },
  { id: 't-cert', cat: 'print', title: { ar: 'شهادة', en: 'Certificate' }, w: 1754, h: 1240, pages: [{ bg: { color: '#FFFFFF' }, elements: [
    SH('rect', 40, 40, 1674, 1160, '', { stroke: '#1F2A44', strokeWidth: 14 }),
    SH('rect', 80, 80, 1594, 1080, '', { stroke: '#F2A541', strokeWidth: 4 }),
    IC('award', 787, 130, 180, '#F2A541', { strokeWidth: 1.4 }),
    TX('شهادة تقدير', 140, 330, 1474, 120, { fontFamily: 'Reem Kufi', bold: true }),
    TX('تُمنح هذه الشهادة إلى', 140, 500, 1474, 52, { fill: '#5E6573' }),
    TX('اسم المتدرّب', 140, 590, 1474, 110, { fontFamily: 'Amiri', fill: '#E4572E', bold: true }),
    TX('تقديراً لجهوده المتميزة وإتمامه الدورة بنجاح', 140, 760, 1474, 52, { fill: '#5E6573' }),
    LN(250, 1010, 400, '#1F2A44', 3), TX('التوقيع', 250, 1030, 400, 40),
    LN(1100, 1010, 400, '#1F2A44', 3), TX('التاريخ', 1100, 1030, 400, 40),
  ] }] },
  { id: 't-announce', cat: 'social', title: { ar: 'إعلان (إنجليزي)', en: 'Announcement' }, w: 1200, h: 630, pages: [{ bg: { color: '#F2A541' }, elements: [
    SH('speech', 640, 90, 480, 420, '#1F2A44'),
    IC('party-popper', 780, 150, 200, '#F2A541', { strokeWidth: 1.5 }),
    TX('We are\nhiring!', 70, 120, 560, 120, { fontFamily: 'Bebas Neue', align: 'left', lineHeight: 1 }),
    TX('Designers, developers and writers. Apply by Friday.', 70, 400, 520, 36, { fontFamily: 'Montserrat', align: 'left', lineHeight: 1.4 }),
  ] }] },
];
TEMPLATES.forEach((tp) => tp.pages.forEach((p) => reId(p.elements)));

/* Ready-made text combinations (Text panel). */
const TEXT_COMBOS = [
  { label: 'تخفيضات', els: [TX('تخفيضات', 0, 0, 600, 110, { fontFamily: 'Lalezar', fill: '#E4572E' }), TX('حتى ٥٠٪ على كل شيء', 0, 140, 600, 40, { bold: true })] },
  { label: 'SALE', els: [TX('SUMMER', 0, 0, 600, 70, { fontFamily: 'Montserrat', bold: true, letterSpacing: 12 }), TX('SALE', 0, 80, 600, 170, { fontFamily: 'Bebas Neue', fill: '#E4572E' })] },
  { label: 'مبروك', els: [TX('ألف مبروك', 0, 0, 600, 100, { fontFamily: 'Reem Kufi', fill: '#B08D57', bold: true })] },
  { label: 'Hello', els: [TX('Hello there', 0, 0, 600, 90, { fontFamily: 'Pacifico', fill: '#2A6F97' })] },
  { label: 'اقتباس', els: [TX('"لا تؤجل عمل اليوم إلى الغد"', 0, 0, 600, 56, { fontFamily: 'Amiri', bold: true, lineHeight: 1.4 })] },
  { label: 'Title', els: [TX('BIG TITLE', 0, 0, 600, 110, { fontFamily: 'Oswald', bold: true, stroke: '#1F2A44', strokeWidth: 3, fill: '#F2A541' })] },
];

const GRADIENTS = [['#E4572E', '#F2A541'], ['#2A6F97', '#61A5C2'], ['#1F2A44', '#4A5A85'], ['#2A9D8F', '#E9C46A'], ['#F6D6C7', '#E4572E'], ['#8E9AAF', '#EFD3D7'], ['#0F2027', '#2C5364'], ['#F7F3E3', '#E3D5B8']];
const DEFAULT_COLORS = ['#000000', '#1F2A44', '#5E6573', '#B8BDC7', '#FFFFFF', '#E4572E', '#F2A541', '#FACC15', '#2A9D8F', '#2E7D32', '#2A6F97', '#61A5C2', '#6D28D9', '#DB2777', '#B08D57', '#F4E9D8'];
const EMOJI = ['😀', '😍', '😂', '🥳', '😎', '🤩', '👍', '🙏', '👏', '💪', '❤️', '🔥', '⭐', '✨', '🎉', '🎁', '🎂', '☕', '🍕', '🌙', '☀️', '🌸', '🌴', '⚽', '📚', '✏️', '💡', '📣', '💰', '🛍️', '✅', '❌'];
