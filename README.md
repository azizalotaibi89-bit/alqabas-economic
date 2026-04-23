# القبس الاقتصادي

موقع إخباري اقتصادي كويتي يعرض آخر أخبار @thekstocks على منصة إكس.

## التقنيات المستخدمة

- **Frontend**: React + Vite + Tailwind CSS (مُنشر على Netlify)
- **Backend**: Node.js + Express (مُنشر على Render.com)
- **مصدر الأخبار**: حساب @thekstocks عبر Nitter RSS

## التشغيل محلياً

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# عدّل VITE_API_URL=http://localhost:3001
npm run dev
```

## النشر

### Render.com (Backend)
1. اربط المستودع بـ Render
2. اضبط `Root Directory` على `backend`
3. أضف متغير البيئة `FRONTEND_URL` بعنوان موقع Netlify

### Netlify (Frontend)
1. اربط المستودع بـ Netlify
2. اضبط `Base directory` على `frontend`
3. اضبط `Build command` على `npm run build`
4. أضف متغير البيئة `VITE_API_URL` بعنوان خدمة Render
