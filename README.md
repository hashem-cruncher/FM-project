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

# Arabic Speech Recognition Learning Tool

## Overview

This project implements a comprehensive Arabic speech recognition system integrated with an existing Arabic language learning platform. The system allows students to practice reading Arabic text aloud and receive immediate feedback on their pronunciation and reading fluency.

## Features

- **Speech Recording and Recognition**: Uses Web Speech API with Arabic language support
- **Text Comparison Algorithm**: Compares spoken text with original content using specialized Arabic text normalization
- **Pronunciation Error Detection**: Identifies and categorizes errors as severe, minor, or correct
- **Visual Feedback**: Highlights pronunciation issues with intuitive color coding
- **Progress Tracking**: Tracks user's reading improvement over time with detailed analytics
- **Cross-Browser Support**: Primary support for Chrome/Edge with fallback options

## Technical Implementation

### Frontend Components

1. **SpeechRecognition Component**:
   - Records user's speech using browser APIs
   - Processes and analyzes pronunciation accuracy
   - Provides visual feedback on errors
   - Allows playback of recorded audio

2. **SpeechAnalytics Component**:
   - Visualizes pronunciation performance metrics
   - Shows progress over time
   - Displays statistics like accuracy trends

### Backend Components

1. **SpeechActivity Model**:
   - Stores speech activity data
   - Records original text, recognized text, and accuracy metrics

2. **Speech API Routes**:
   - `/api/speech/save`: Saves speech recognition activity
   - `/api/speech/history`: Gets speech recognition history
   - `/api/speech/stats`: Gets speech recognition statistics

## Arabic Language Features

- Support for Modern Standard Arabic (فصحى)
- Text normalization handling:
  - Removal of diacritics (تشكيل/حركات)
  - Normalization of letter variations (alif forms, etc.)
  - Special handling for sun and moon letters

## Usage

1. Navigate to the Stories section
2. Complete the reading and comprehension questions
3. Access the Pronunciation Exercise tab
4. Click "Start Recording" and read the text aloud
5. Review your pronunciation analysis with highlighted errors
6. Track your progress over time with analytics

## Technologies Used

- **Frontend**: React, Web Speech API, MediaRecorder API
- **Backend**: Flask, SQLAlchemy
- **Processing**: Custom Levenshtein distance algorithm adapted for Arabic

## Future Enhancements

- Offline speech recognition with TensorFlow.js
- Support for dialect variations
- More granular phoneme-level feedback
- Speech pace and rhythm analysis

## Setup for Development

1. Clone the repository
2. Install frontend dependencies:
   ```
   cd fm-frontend
   npm install
   ```
3. Install backend dependencies:
   ```
   cd fm-backend
   pip install -r requirements.txt
   ```
4. Run database migrations:
   ```
   cd fm-backend
   python migrations/create_speech_activity_table.py
   ```
5. Start the development servers:
   ```
   # Terminal 1
   cd fm-frontend
   npm run dev
   
   # Terminal 2
   cd fm-backend
   python run.py
   ```

## Credits

This feature was developed as a graduation project for Arabic language learning, utilizing open-source technologies for speech recognition and analysis. 