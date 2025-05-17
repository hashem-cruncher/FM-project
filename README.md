# Arabic Learning App 🎯 | تطبيق تعلم اللغة العربية

A modern web application for learning Arabic, featuring AI-powered exercises and progress tracking.

تطبيق ويب حديث لتعلم اللغة العربية، يتميز بتمارين مدعومة بالذكاء الاصطناعي وتتبع التقدم.

## Features | المميزات

- 🔒 User Authentication | مصادقة المستخدم
- 📚 Interactive Lessons | دروس تفاعلية
- 🤖 AI-Generated Content | محتوى مولد بالذكاء الاصطناعي
- 📊 Progress Tracking | تتبع التقدم
- 🏆 Rewards System | نظام المكافآت

## Tech Stack | التقنيات المستخدمة

### Backend | الواجهة الخلفية
- Django
- Django REST Framework
- SQLite
- JWT Authentication

### Frontend | الواجهة الأمامية
- Next.js
- TypeScript
- Tailwind CSS
- React Context API

## Setup | الإعداد

### Prerequisites | المتطلبات الأساسية
- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup | إعداد الواجهة الخلفية

1. Navigate to backend directory | الانتقال إلى مجلد الواجهة الخلفية
```bash
cd fm-backend
```

2. Create virtual environment | إنشاء بيئة افتراضية
```bash
python -m venv venv
```

3. Activate virtual environment | تفعيل البيئة الافتراضية
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. Install dependencies | تثبيت التبعيات
```bash
pip install -r requirements.txt
```

5. Run migrations | تشغيل الترحيلات
```bash
python manage.py migrate
```

6. Create superuser | إنشاء مستخدم مدير
```bash
python manage.py createsuperuser
```

7. Start backend server | تشغيل الخادم الخلفي
```bash
python manage.py runserver
```

The backend will be available at | سيكون الخادم الخلفي متاحًا على:
http://localhost:8000

### Frontend Setup | إعداد الواجهة الأمامية

1. Navigate to frontend directory | الانتقال إلى مجلد الواجهة الأمامية
```bash
cd fm-frontend
```

2. Install dependencies | تثبيت التبعيات
```bash
npm install
# or
yarn install
```

3. Start development server | تشغيل خادم التطوير
```bash
npm run dev
# or
yarn dev
```

The frontend will be available at | ستكون الواجهة الأمامية متاحة على:
http://localhost:3000

## Project Structure | هيكل المشروع

```
arabic-learning-app/
├── fm-backend/
│   ├── api/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── arabic_learning_backend/
│   │   ├── settings.py
│   │   └── urls.py
│   └── requirements.txt
├── fm-frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   ├── lessons/
│   │   │   └── layout.tsx
│   │   └── components/
│   └── package.json
└── README.md
```

## API Endpoints | نقاط النهاية للـ API

### Authentication | المصادقة
- POST `/api/auth/register/` - Register new user | تسجيل مستخدم جديد
- POST `/api/auth/login/` - Login user | تسجيل دخول المستخدم

### Lessons | الدروس
- GET `/api/lessons/` - List all lessons | قائمة جميع الدروس
- GET `/api/lessons/{id}/` - Get lesson details | الحصول على تفاصيل الدرس
- POST `/api/lessons/{id}/start/` - Start a lesson | بدء درس

### Progress | التقدم
- GET `/api/progress/` - Get user progress | الحصول على تقدم المستخدم
- POST `/api/exercises/{id}/submit/` - Submit exercise answer | إرسال إجابة التمرين

## Contributing | المساهمة

1. Fork the repository | انسخ المستودع
2. Create your feature branch | أنشئ فرع الميزة الخاص بك
3. Commit your changes | اعتمد تغييراتك
4. Push to the branch | ادفع إلى الفرع
5. Create a pull request | أنشئ طلب سحب

## License | الترخيص

This project is licensed under the MIT License - see the LICENSE file for details.

هذا المشروع مرخص تحت رخصة MIT - انظر ملف LICENSE للتفاصيل. 