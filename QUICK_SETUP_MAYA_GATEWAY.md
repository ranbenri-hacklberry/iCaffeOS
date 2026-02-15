# Setup מהיר - Maya Gateway 🚀

## דקה אחת להפעלה!

### 1. הוסף ל-App.tsx

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MayaAuthProvider } from './context/MayaAuthContext';
import TestMayaGateway from './pages/TestMayaGateway';

function App() {
  return (
    <BrowserRouter>
      <MayaAuthProvider>
        <Routes>
          {/* דף הבדיקה */}
          <Route path="/test-maya" element={<TestMayaGateway />} />

          {/* הדפים הרגילים שלך */}
          <Route path="/" element={<HomePage />} />
          {/* ... */}
        </Routes>
      </MayaAuthProvider>
    </BrowserRouter>
  );
}
```

### 2. הפעל Backend

```bash
cd backend
npm install
npm start
# Backend רץ על http://localhost:3001
```

### 3. הפעל Frontend

```bash
cd frontend_source
npm install
npm start
# Frontend רץ על http://localhost:3000
```

### 4. פתח דף הבדיקה

```
http://localhost:3000/test-maya
```

---

## 🎯 מה תראה בדף הבדיקה

### צד שמאל - Gateway
- כפתור "פתח Maya Gateway"
- זיהוי פנים מלא מסך
- מעבר אוטומטי ל-PIN אם נכשל
- בחירת תפקיד (Clock-In) עבור עובדים
- חלון צ'אט Maya

### צד ימין - Debug Panel
- **Status:** מצב נוכחי (SCANNING, MATCHING, etc.)
- **Employee:** שם + תפקיד + confidence
- **Manual PIN Test:** בדיקה ידנית עם PIN (1234)
- **System Logs:** כל האירועים בזמן אמת
- **Quick Actions:** קפיצה ישירה למצבים שונים

---

## 📋 צ'קליסט לפני בדיקה

### Database
```sql
-- ודא שיש לך עובד עם PIN
SELECT id, name, access_level, pin_hash FROM employees;

-- אם אין, צור אחד:
INSERT INTO employees (id, name, access_level, pin_hash, business_id)
VALUES (
  gen_random_uuid(),
  'Danny Test',
  'Worker',
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn98Wu3t4L2alHYpIp/6HVMQEwhi', -- '1234'
  '22222222-2222-2222-2222-222222222222'
);
```

### Face-API Models
```bash
# הורד models ל:
frontend_source/public/models/

# קבצים נדרשים:
- tiny_face_detector_model-weights_manifest.json
- tiny_face_detector_model-shard1
- face_landmark_68_tiny_model-weights_manifest.json
- face_landmark_68_tiny_model-shard1
- face_recognition_model-weights_manifest.json
- face_recognition_model-shard1

# מקור:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights
```

### Backend בריא?
```bash
curl http://localhost:3001/api/maya/health
# תשובה: {"healthy": true}
```

---

## 🧪 תרחישי בדיקה

### תרחיש 1: PIN ידני
1. פתח את דף הבדיקה
2. בDebug Panel - הזן PIN: `1234`
3. לחץ "Test"
4. צפה בלוגים: זיהוי → בחירת תפקיד → מורשה

### תרחיש 2: זיהוי פנים מלא
1. לחץ "פתח Maya Gateway"
2. אפשר גישה למצלמה
3. הצג פנים למצלמה
4. המתן לזיהוי (2-5 שניות)
5. בחר תפקיד אם אתה עובד
6. כניסה לצ'אט Maya

### תרחיש 3: מעבר בין מצבים
1. השתמש ב-Quick Actions בתחתית Debug Panel
2. "→ SCANNING" - מחזיר לסריקת פנים
3. "→ ERROR" - מדמה שגיאה
4. "→ CLOCK_IN" - קופץ ישר לבחירת תפקיד

---

## 🎨 מידע על הUI

### Anti-Gravity Design
- **Cyan glows** - גווני ציאן זוהרים
- **Glassmorphism** - רקעים שקופים עם טשטוש
- **Smooth animations** - מעברים חלקים עם Framer Motion
- **Split screen** - Gateway משמאל, Debug מימין

### State Machine Flow
```
LOADING
  ↓
SCANNING (זיהוי פנים)
  ↓
MATCHING (בודק במערכת)
  ↓
IDENTIFIED (זוהה!)
  ↓
CLOCK_IN_REQUIRED (בחר תפקיד - רק לעובדים)
  ↓
AUTHORIZED (מורשה - כניסה לצ'אט)
```

---

## 🔧 Troubleshooting

### לא רואה את הכפתור?
```tsx
// ודא ש-TestMayaGateway מיובא נכון
import TestMayaGateway from './pages/TestMayaGateway';

// ושהמסלול קיים
<Route path="/test-maya" element={<TestMayaGateway />} />
```

### שגיאת "MayaAuthProvider not found"?
```tsx
// ודא ש-MayaAuthContext קיים
ls frontend_source/src/context/MayaAuthContext.tsx

// ושהוא מיובא
import { MayaAuthProvider } from './context/MayaAuthContext';
```

### Backend לא מגיב?
```bash
# בדוק שהserver רץ
ps aux | grep node

# הפעל מחדש
cd backend
npm start
```

### Models לא נטענים?
```bash
# ודא שהתיקייה קיימת
ls frontend_source/public/models/

# ושיש בה קבצים
ls frontend_source/public/models/*.json
```

---

## 🚀 אינטגרציה לאפליקציה אמיתית

אחרי שהבדיקה עובדת, להוסיף למסלולים הרגילים:

```tsx
// App.tsx
import MayaGateway from './components/maya/MayaGatewayComplete';

function App() {
  return (
    <MayaAuthProvider>
      {/* הדפים שלך */}
      <Routes>
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/orders" element={<OrdersPage />} />
      </Routes>

      {/* 🆕 Maya Gateway - כפתור צף בכל מקום */}
      <MayaGateway />
    </MayaAuthProvider>
  );
}
```

זה ייתן לך:
- ✅ כפתור ✨ צף בפינה השמאלית התחתונה
- ✅ זיהוי פנים מלא מסך
- ✅ Clock-in אוטומטי בתוך Maya
- ✅ צ'אט עם Maya

---

## 📞 צריך עזרה?

1. בדוק את הלוגים בDebug Panel
2. פתח Console בדפדפן (F12)
3. חפש שגיאות אדומות
4. בדוק Backend logs ב-terminal

---

**סיימת! עכשיו יש לך דף בדיקה מלא עם Debug Panel! 🎉**

נווט ל-`http://localhost:3000/test-maya` ותתחיל לבדוק!
