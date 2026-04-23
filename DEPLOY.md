# دليل النشر - القبس الاقتصادي

## الخطوة 1: رفع الكود على GitHub

افتح Terminal وشغّل الأوامر التالية من داخل مجلد المشروع:

```bash
# افتح مجلد المشروع
cd path/to/alqabas

# أنشئ مستودعاً جديداً على GitHub
gh repo create alqabas-economic --public --push --source=.

# أو يدوياً بدون gh CLI:
git remote add origin https://github.com/YOUR_USERNAME/alqabas-economic.git
git branch -M main
git push -u origin main
```

---

## الخطوة 2: نشر Backend على Render.com

1. اذهب إلى https://render.com وسجّل دخولك
2. اضغط **New → Web Service**
3. اربط حساب GitHub واختر مستودع `alqabas-economic`
4. اضبط الإعدادات:
   - **Name**: `alqabas-economic-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. أضف متغيرات البيئة (Environment Variables):
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = *(اتركه فارغاً مؤقتاً وأضفه بعد نشر Netlify)*
6. اضغط **Create Web Service**
7. **احفظ رابط الخدمة** مثل: `https://alqabas-economic-api.onrender.com`

---

## الخطوة 3: نشر Frontend على Netlify

1. اذهب إلى https://netlify.com وسجّل دخولك
2. اضغط **Add new site → Import an existing project**
3. اختر GitHub وحدد مستودع `alqabas-economic`
4. اضبط إعدادات البناء:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. أضف متغيرات البيئة:
   - `VITE_API_URL` = الرابط الذي حصلت عليه من Render (مثال: `https://alqabas-economic-api.onrender.com`)
6. اضغط **Deploy site**
7. **احفظ رابط الموقع** مثل: `https://alqabas-economic.netlify.app`

---

## الخطوة 4: ربط Render بـ Netlify

ارجع إلى Render وأضف:
- `FRONTEND_URL` = رابط موقع Netlify

---

## ✅ اكتمل النشر!

موقعك سيكون متاحاً على:
- **Frontend**: https://alqabas-economic.netlify.app
- **API**: https://alqabas-economic-api.onrender.com/api/news
