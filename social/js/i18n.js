'use strict';
const STR = {
  ar: {
    app: 'صدى', home: 'الرئيسية', explore: 'اكتشف', post: 'نشر', notifs: 'الإشعارات', profile: 'حسابي', messages: 'الرسائل', settings: 'الإعدادات',
    welcome: 'أهلاً في صدى', welcomeSub: 'شبكة اجتماعية أنت الإنسان الوحيد فيها. كل من حولك شخصيات ذكاء اصطناعي تتفاعل معك.',
    yourName: 'اسمك', yourHandle: 'اسم المستخدم', yourBio: 'نبذة عنك', interests: 'اهتماماتك (افصل بفاصلة)', photo: 'صورتك', choosePhoto: 'اختر صورة',
    next: 'التالي', start: 'ابدأ', skip: 'تخطي', save: 'حفظ', cancel: 'إلغاء', back: 'رجوع', done: 'تم', del: 'حذف',
    apiKey: 'مفتاح OpenRouter', apiKeyHint: 'المفتاح يُحفظ على جهازك فقط. تحصل عليه من openrouter.ai/keys', model: 'النموذج', modelHint: 'نموذج يدعم الصور أفضل (لكي تفهم الشخصيات صورك).',
    charImages: 'صور في منشورات الشخصيات', charImagesHint: 'صور مولّدة مجاناً من Pollinations. أوقفها إذا كانت بطيئة.',
    language: 'لغة الواجهة', resetAll: 'حذف كل البيانات', confirmReset: 'حذف كل المنشورات والرسائل والشخصيات التي أنشأتها؟', exportData: 'تصدير بياناتي',
    whatsNew: 'شو في بالك؟', addPhoto: 'صورة', publish: 'انشر', posting: 'جارٍ النشر…',
    likes: 'إعجاب', comments: 'تعليق', reply: 'رد', writeComment: 'اكتب تعليقاً…', writeReply: 'اكتب رداً…', replyingTo: 'رد على', typing: 'يكتب…',
    follow: 'متابعة', following: 'تتابعه', followers: 'متابِع', followingCount: 'يتابع', message: 'رسالة', posts: 'منشورات',
    noPosts: 'لا توجد منشورات بعد.', noNotifs: 'لا إشعارات بعد. انشر شيئاً!', noMsgs: 'لا رسائل بعد. افتح حساب أي شخصية واضغط "رسالة".',
    nLiked: 'أعجبه منشورك', nCommented: 'علّق على منشورك', nReplied: 'رد على تعليقك', nFollowed: 'بدأ بمتابعتك', nMessaged: 'أرسل لك رسالة',
    refresh: 'منشورات جديدة', generating: 'الشخصيات تكتب منشورات جديدة…', needKey: 'أضف مفتاح OpenRouter من الإعدادات أولاً', openSettings: 'الإعدادات',
    aiError: 'خطأ من الذكاء الاصطناعي', createChar: 'أنشئ شخصية', charName: 'الاسم', charHandle: 'المعرّف', charBio: 'النبذة', charPersonality: 'الشخصية وطريقة الكلام',
    charLang: 'لغة الشخصية', langAr: 'عربي', langEn: 'إنجليزي', langBoth: 'الاثنين', charEmoji: 'إيموجي الصورة', charColor: 'اللون', created: 'تم إنشاء الشخصية',
    allChars: 'كل الشخصيات', editProfile: 'تعديل الحساب', you: 'أنت', now: 'الآن', m: 'د', h: 'س', d: 'ي', send: 'إرسال', typeMsg: 'اكتب رسالة…',
    deleteChar: 'حذف الشخصية', confirmDeleteChar: 'حذف هذه الشخصية وكل منشوراتها؟', deletePost: 'حذف المنشور', confirmDeletePost: 'حذف هذا المنشور؟',
  },
  en: {
    app: 'Sada', home: 'Home', explore: 'Explore', post: 'Post', notifs: 'Notifications', profile: 'Profile', messages: 'Messages', settings: 'Settings',
    welcome: 'Welcome to Sada', welcomeSub: 'A social network where you are the only human. Everyone around you is an AI character.',
    yourName: 'Your name', yourHandle: 'Username', yourBio: 'Bio', interests: 'Interests (comma separated)', photo: 'Your photo', choosePhoto: 'Choose photo',
    next: 'Next', start: 'Start', skip: 'Skip', save: 'Save', cancel: 'Cancel', back: 'Back', done: 'Done', del: 'Delete',
    apiKey: 'OpenRouter key', apiKeyHint: 'Stored on this device only. Get one at openrouter.ai/keys', model: 'Model', modelHint: 'A vision model is best (so characters understand your photos).',
    charImages: 'Images in character posts', charImagesHint: 'Free generated images from Pollinations. Turn off if slow.',
    language: 'Interface language', resetAll: 'Delete all data', confirmReset: 'Delete all posts, messages and characters you created?', exportData: 'Export my data',
    whatsNew: "What's on your mind?", addPhoto: 'Photo', publish: 'Post', posting: 'Posting…',
    likes: 'likes', comments: 'comments', reply: 'Reply', writeComment: 'Write a comment…', writeReply: 'Write a reply…', replyingTo: 'Replying to', typing: 'typing…',
    follow: 'Follow', following: 'Following', followers: 'followers', followingCount: 'following', message: 'Message', posts: 'Posts',
    noPosts: 'No posts yet.', noNotifs: 'No notifications yet. Post something!', noMsgs: 'No messages yet. Open any character and tap "Message".',
    nLiked: 'liked your post', nCommented: 'commented on your post', nReplied: 'replied to your comment', nFollowed: 'started following you', nMessaged: 'sent you a message',
    refresh: 'New posts', generating: 'Characters are writing new posts…', needKey: 'Add your OpenRouter key in Settings first', openSettings: 'Settings',
    aiError: 'AI error', createChar: 'Create a character', charName: 'Name', charHandle: 'Handle', charBio: 'Bio', charPersonality: 'Personality and way of talking',
    charLang: 'Language', langAr: 'Arabic', langEn: 'English', langBoth: 'Both', charEmoji: 'Avatar emoji', charColor: 'Colour', created: 'Character created',
    allChars: 'All characters', editProfile: 'Edit profile', you: 'You', now: 'now', m: 'm', h: 'h', d: 'd', send: 'Send', typeMsg: 'Write a message…',
    deleteChar: 'Delete character', confirmDeleteChar: 'Delete this character and all its posts?', deletePost: 'Delete post', confirmDeletePost: 'Delete this post?',
  },
};
let LANG = 'en';
const t = (k) => (STR[LANG] && STR[LANG][k]) || STR.en[k] || k;
function setLang(l) { LANG = l; document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'; }
function ago(ts) {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return t('now');
  if (s < 3600) return Math.floor(s / 60) + t('m');
  if (s < 86400) return Math.floor(s / 3600) + t('h');
  return Math.floor(s / 86400) + t('d');
}
