'use strict';
const STR = {
  ar: {
    appName: 'لوحة', heroTitle: 'صمّم أي شيء، مجاناً بالكامل', heroSub: 'قوالب، نصوص عربية، أشكال وصورك الخاصة. بدون اشتراك وبدون علامة مائية.',
    newDesign: 'تصميم جديد', startWithSize: 'ابدأ بمقاس', yourDesigns: 'تصاميمك', templates: 'القوالب', noDesigns: 'لا توجد تصاميم بعد. اختر مقاساً أو قالباً للبدء.',
    footer: 'لوحة: محرر تصاميم مجاني يعمل على جهازك. كل تصاميمك محفوظة على هذا الجهاز.',
    all: 'الكل', social: 'تواصل اجتماعي', story: 'ستوري', presentation: 'عروض', print: 'طباعة', thumbnail: 'صور مصغّرة',
    custom: 'مقاس مخصص', width: 'العرض', height: 'الارتفاع', unit: 'الوحدة', create: 'إنشاء', cancel: 'إلغاء', ok: 'تم', apply: 'تطبيق',
    rename: 'إعادة تسمية', duplicate: 'نسخ', del: 'حذف', confirmDelete: 'حذف هذا التصميم نهائياً؟', untitled: 'تصميم بدون عنوان',
    home: 'الرئيسية', undo: 'تراجع', redo: 'إعادة', resize: 'تغيير المقاس', present: 'عرض', download: 'تحميل', multiSelect: 'تحديد متعدد',
    tabTemplates: 'قوالب', tabText: 'نص', tabElements: 'عناصر', tabUploads: 'صوري', tabBackground: 'خلفية', tabLayers: 'طبقات', tabBrand: 'هويتي', tabProps: 'تعديل',
    addHeading: 'أضف عنواناً', addSubheading: 'أضف عنواناً فرعياً', addBody: 'أضف نصاً عادياً', textCombos: 'تنسيقات جاهزة',
    defHeading: 'عنوان رئيسي', defSub: 'عنوان فرعي', defBody: 'اكتب نصك هنا',
    shapes: 'أشكال', lines: 'خطوط', icons: 'أيقونات', emoji: 'إيموجي',
    upload: 'رفع صور', uploadHint: 'الصور تبقى على جهازك فقط.', noUploads: 'لم ترفع أي صور بعد.',
    bgColor: 'لون الخلفية', gradients: 'تدرجات', bgImage: 'صورة خلفية', removeBgImage: 'إزالة صورة الخلفية', pickFromUploads: 'اختر من صورك',
    layersEmpty: 'لا توجد عناصر في هذه الصفحة.',
    brandColors: 'ألوان علامتك', brandFonts: 'خطوط علامتك', headingFont: 'خط العناوين', bodyFont: 'خط النصوص', addColor: 'إضافة لون', brandHint: 'ألوانك تظهر في كل منتقي ألوان، وخطوطك تُستخدم عند إضافة نص.',
    text: 'النص', font: 'الخط', size: 'الحجم', color: 'اللون', fill: 'التعبئة', stroke: 'الحد', strokeWidth: 'سماكة الحد', align: 'المحاذاة',
    lineHeight: 'تباعد الأسطر', letterSpacing: 'تباعد الأحرف', shadow: 'ظل', outline: 'إطار النص', radius: 'استدارة الزوايا', opacity: 'الشفافية',
    position: 'الترتيب', alignPage: 'محاذاة مع الصفحة', arrange: 'ترتيب', forward: 'للأمام', backward: 'للخلف', toFront: 'للمقدمة', toBack: 'للخلفية',
    flipH: 'قلب أفقي', flipV: 'قلب عمودي', lock: 'قفل', unlock: 'فك القفل', group: 'تجميع', ungroup: 'فك التجميع', edit: 'تحرير', props: 'خصائص',
    crop: 'قص', filters: 'تأثيرات', brightness: 'السطوع', contrast: 'التباين', saturation: 'التشبع', blur: 'التمويه', grayscale: 'أبيض وأسود', sepia: 'قديم', reset: 'إعادة ضبط',
    cropLeft: 'من اليسار', cropRight: 'من اليمين', cropTop: 'من الأعلى', cropBottom: 'من الأسفل', setAsBg: 'اجعلها خلفية',
    dash: 'منقط', arrowStart: 'سهم بالبداية', arrowEnd: 'سهم بالنهاية', none: 'بدون',
    page: 'صفحة', addPage: 'صفحة جديدة', dupPage: 'نسخ الصفحة', delPage: 'حذف الصفحة', movePrev: 'تحريك للخلف', moveNext: 'تحريك للأمام', confirmDelPage: 'حذف هذه الصفحة؟',
    format: 'الصيغة', quality: 'الجودة', pages: 'الصفحات', currentPage: 'الصفحة الحالية', allPages: 'كل الصفحات', transparent: 'خلفية شفافة',
    exporting: 'جارٍ التصدير…', exported: 'تم التصدير', exportFail: 'فشل التصدير',
    resizeHint: 'اختر مقاساً جديداً. العناصر تتكيف تلقائياً.', resizeCopy: 'إنشاء نسخة بالمقاس الجديد', resizeThis: 'تغيير هذا التصميم', resized: 'تم تغيير المقاس',
    applyTemplate: 'استبدال الصفحة الحالية بهذا القالب؟', saved: 'تم الحفظ', editText: 'تحرير النص',
    multiOn: 'التحديد المتعدد مفعّل: اضغط على العناصر لإضافتها', groupNeed2: 'حدد عنصرين أو أكثر للتجميع',
    elText: 'نص', elShape: 'شكل', elImage: 'صورة', elIcon: 'أيقونة', elLine: 'خط', elGroup: 'مجموعة',
    tooBig: 'المقاس كبير جداً. الحد الأقصى 8000 بكسل.', tooSmall: 'المقاس صغير جداً.',
  },
  en: {
    appName: 'Lawha', heroTitle: 'Design anything. Completely free.', heroSub: 'Templates, Arabic text, shapes and your own photos. No subscription, no watermark.',
    newDesign: 'New design', startWithSize: 'Start with a size', yourDesigns: 'Your designs', templates: 'Templates', noDesigns: 'No designs yet. Pick a size or a template to start.',
    footer: 'Lawha is a free design editor that runs on your device. Your designs are saved on this device.',
    all: 'All', social: 'Social', story: 'Story', presentation: 'Presentation', print: 'Print', thumbnail: 'Thumbnail',
    custom: 'Custom size', width: 'Width', height: 'Height', unit: 'Unit', create: 'Create', cancel: 'Cancel', ok: 'Done', apply: 'Apply',
    rename: 'Rename', duplicate: 'Duplicate', del: 'Delete', confirmDelete: 'Delete this design for good?', untitled: 'Untitled design',
    home: 'Home', undo: 'Undo', redo: 'Redo', resize: 'Resize', present: 'Present', download: 'Download', multiSelect: 'Multi-select',
    tabTemplates: 'Templates', tabText: 'Text', tabElements: 'Elements', tabUploads: 'Uploads', tabBackground: 'Background', tabLayers: 'Layers', tabBrand: 'Brand', tabProps: 'Edit',
    addHeading: 'Add a heading', addSubheading: 'Add a subheading', addBody: 'Add body text', textCombos: 'Text styles',
    defHeading: 'Heading', defSub: 'Subheading', defBody: 'Type your text here',
    shapes: 'Shapes', lines: 'Lines', icons: 'Icons', emoji: 'Emoji',
    upload: 'Upload images', uploadHint: 'Images stay on your device.', noUploads: 'No uploads yet.',
    bgColor: 'Background colour', gradients: 'Gradients', bgImage: 'Background image', removeBgImage: 'Remove background image', pickFromUploads: 'Pick from uploads',
    layersEmpty: 'No elements on this page.',
    brandColors: 'Brand colours', brandFonts: 'Brand fonts', headingFont: 'Heading font', bodyFont: 'Body font', addColor: 'Add colour', brandHint: 'Your colours show in every colour picker; your fonts are used when you add text.',
    text: 'Text', font: 'Font', size: 'Size', color: 'Colour', fill: 'Fill', stroke: 'Border', strokeWidth: 'Border width', align: 'Align',
    lineHeight: 'Line height', letterSpacing: 'Letter spacing', shadow: 'Shadow', outline: 'Text outline', radius: 'Corner radius', opacity: 'Transparency',
    position: 'Position', alignPage: 'Align to page', arrange: 'Arrange', forward: 'Forward', backward: 'Backward', toFront: 'To front', toBack: 'To back',
    flipH: 'Flip horizontal', flipV: 'Flip vertical', lock: 'Lock', unlock: 'Unlock', group: 'Group', ungroup: 'Ungroup', edit: 'Edit', props: 'Properties',
    crop: 'Crop', filters: 'Adjust', brightness: 'Brightness', contrast: 'Contrast', saturation: 'Saturation', blur: 'Blur', grayscale: 'Greyscale', sepia: 'Sepia', reset: 'Reset',
    cropLeft: 'Left', cropRight: 'Right', cropTop: 'Top', cropBottom: 'Bottom', setAsBg: 'Set as background',
    dash: 'Dashed', arrowStart: 'Arrow at start', arrowEnd: 'Arrow at end', none: 'None',
    page: 'Page', addPage: 'Add page', dupPage: 'Duplicate page', delPage: 'Delete page', movePrev: 'Move back', moveNext: 'Move forward', confirmDelPage: 'Delete this page?',
    format: 'Format', quality: 'Size', pages: 'Pages', currentPage: 'Current page', allPages: 'All pages', transparent: 'Transparent background',
    exporting: 'Exporting…', exported: 'Exported', exportFail: 'Export failed',
    resizeHint: 'Pick a new size. Elements adapt automatically.', resizeCopy: 'Create a resized copy', resizeThis: 'Resize this design', resized: 'Resized',
    applyTemplate: 'Replace the current page with this template?', saved: 'Saved', editText: 'Edit text',
    multiOn: 'Multi-select on: tap elements to add them', groupNeed2: 'Select two or more elements to group',
    elText: 'Text', elShape: 'Shape', elImage: 'Image', elIcon: 'Icon', elLine: 'Line', elGroup: 'Group',
    tooBig: 'That size is too big. The maximum is 8000 px.', tooSmall: 'That size is too small.',
  },
};
let LANG = 'ar';
const t = (k) => (STR[LANG] && STR[LANG][k]) || STR.en[k] || k;
const tt = (obj) => (obj && typeof obj === 'object' ? (obj[LANG] || obj.en) : obj);
function applyLang(lang) {
  LANG = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  $$('[data-i]').forEach((el) => { el.innerHTML = icon(el.dataset.i); });
  $$('[data-title]').forEach((el) => { el.title = t(el.dataset.title); el.setAttribute('aria-label', t(el.dataset.title)); });
  $('#langBtn').textContent = lang === 'ar' ? 'English' : 'العربية';
  $('#newBtn').innerHTML = icon('plus') + esc(t('newDesign'));
  $('#downloadBtn').innerHTML = icon('download', 18) + `<span>${esc(t('download'))}</span>`;
}
