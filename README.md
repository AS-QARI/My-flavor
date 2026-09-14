# ذائقتي — دفتر المطاعم

تطبيق عربي لتسجيل المطاعم والتقييمات والصور، مع خريطة وبحث ووضع داكن وتسجيل دخول.

## النشر على Netlify

1. افتح [Netlify](https://app.netlify.com/) واختر **Add new project** ثم **Import an existing project**.
2. اربط GitHub واختر المستودع `AS-QARI/My-flavor` والفرع `main`.
3. Netlify سيقرأ ملف `netlify.toml` تلقائيًا؛ اترك أمر البناء `npm run build` ومجلد النشر `dist`.
4. قبل النشر، من **Project configuration → Environment variables** أضف القيم كأسرار:
   - `ADMIN_USERNAME` — اسم المستخدم.
   - `ADMIN_PASSWORD` — كلمة المرور.
   - `SESSION_SECRET` — قيمة عشوائية بطول 32 حرفًا أو أكثر.
5. اضغط **Deploy site**. سيظهر رابط `netlify.app` ويمكنك تغييره أو ربط دومين خاص.

لا تضع بيانات الدخول في GitHub. بيانات المطاعم والصور محفوظة في Netlify Blobs، وهي مهيأة تلقائيًا مع الموقع ولا تحتاج إنشاء قاعدة بيانات أو مساحة صور منفصلة.

## التشغيل محليًا

```bash
npm install
npm run dev
```

للتجربة الكاملة محليًا استخدم `npx netlify dev` وضع الأسرار في إعدادات Netlify أو متغيرات بيئتك المحلية.

## الفحص

```bash
npm run build
npm test
```

## استخدام قوقل ماب

من «أضف مطعمًا»، الصق رابط مشاركة المكان من قوقل ماب ثم اضغط «جلب الموقع». راجع الدبوس والاسم قبل الحفظ. الربط يعتمد على [Maps URLs الرسمية](https://developers.google.com/maps/documentation/urls/get-started) ولا يحتاج مفتاح API.
