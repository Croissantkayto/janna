# سوا — مهام وعادات مشتركة

## التشغيل
1. أنشئ مشروع على Firebase Console، ثم فعّل **Authentication** (Email/Password + Google) و **Firestore**.
2. Project settings ← Add web app ← انسخ الإعدادات داخل `js/firebase.js`.
3. الصق محتوى `firestore.rules` في Firestore ← Rules ثم Publish.
4. شغّل المشروع عبر سيرفر محلي (الـ ES modules لا تعمل بفتح الملف مباشرة):
   `npx serve .` أو إضافة Live Server في VS Code.
5. في Authentication ← Settings ← Authorized domains أضف دومين موقعك (و localhost موجود تلقائيًا).
6. للنشر: `firebase init hosting` ثم `firebase deploy`.

## هيكل الملفات
- `js/firebase.js` الإعدادات · `auth.js` الدخول · `profile.js` الملف الشخصي
- `js/tasks.js` المهام المشتركة والتصنيفات · `habits.js` العادات بالدوائر والديدلاين
- `js/feed.js` الأخبار والإشعارات والترتيب · `ui.js` أدوات مشتركة · `main.js` الربط

## النقاط
مهمة = 10 · تسجيل في عادة = 5 · إنهاء عادة = +25 (غيّرها من أعلى `tasks.js` و `habits.js`).
النقاط تُحسب من المتصفح، فلو عايز حماية من الغش انقلها لاحقًا إلى Cloud Functions.

## الصورة الشخصية
بتاخد صورة Google تلقائيًا، أو الصق رابط صورة. لرفع صور مباشرة استخدم Firebase Storage.
