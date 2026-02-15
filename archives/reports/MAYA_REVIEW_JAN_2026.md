# סיכום שינויים לבדיקת מאיה - ינואר 2026

## Branch: `develop` (מעודכן!)

---

## 📋 סיכום השינויים העיקריים

### 1. ✅ תיקון שמירת מלאי (קריטי!)

**הבעיה:** עדכון מלאי לא נשמר בדאטהבייס (RLS חסם את העדכון)
**הפתרון:** יצירת RPC `update_inventory_stock` שעוקף RLS

**קבצים:**

- `src/components/manager/InventoryScreen.jsx` - שימוש ב-RPC
- `src/pages/kds/components/KDSInventoryScreen.jsx` - שימוש ב-RPC

---

### 2. 📦 מערכת Triple-Check לקליטת סחורה

**פיצ'ר חדש:** השוואה בין מה שהוזמן, מה בחשבונית, ומה התקבל בפועל

**קבצים חדשים:**

- `src/components/manager/TripleCheckCard.jsx` - כרטיס השוואת כמויות

**פיצ'רים:**

- סריקת חשבונית עם OCR (Grok/Gemini)
- עיגול חכם לפי `count_step`
- קבלה **ללא חשבונית** (רק מנתוני ההזמנה)
- חיווי ויזואלי כתום כשאין חשבונית

---

### 3. 🔢 פרמטרים חדשים למלאי

**עמודות שנוספו:**

- `count_step` - צעד לספירת מלאי (למשל 0.5 ק"ג)
- `order_step` - צעד להזמנה מספק
- `min_order` - הזמנה מינימלית מספק
- `recipe_step` - צעד לעריכת מתכונים
- `last_count_source` - מקור העדכון האחרון
- `last_counted_by` - מי עדכן אחרון

---

### 4. 👤 הצגת מידע על ספירה

**מוצג מתחת לספירה:**

- תאריך ושעה של העדכון
- שם העובד שספר
- מקור העדכון:
  - "ספירה ע״י [שם]" - ספירה ידנית
  - "קליטת הזמנה" - קבלת סחורה
  - "הזמנת לקוח" - הפחתה אוטומטית

---

### 5. 🎨 עיצוב מחודש לכרטיס מלאי

**InventoryItemCard.jsx - שוכתב מחדש!**

- עיצוב קומפקטי כמו ב-KDS
- כפתור שמירה אחיד (אייקון דיסקט כחול)
- הודעת שינוי בצבע כחול
- שורת מידע אחת מתחת לספירה

---

### 6. 🏢 בידוד עסקי

**תיקון:** ספקים ופריטי מלאי מסוננים לפי `business_id`
**קובץ:** `src/components/manager/InventoryScreen.jsx`

---

## 🗄️ סקריפטי SQL שצריך להריץ

```sql
-- 1. עמודות חדשות
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS order_step NUMERIC DEFAULT 1;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS min_order NUMERIC DEFAULT 1;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS last_count_source TEXT DEFAULT 'manual';
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS recipe_step NUMERIC DEFAULT 10;

-- 2. RPC לעדכון מלאי (עם מקור ושם)
CREATE OR REPLACE FUNCTION update_inventory_stock(...) -- כבר קיים

-- 3. RPC לקבלת סחורה (שומר source='order_receipt')
CREATE OR REPLACE FUNCTION receive_inventory_shipment(...) -- כבר קיים
```

---

## 📁 קבצים שהשתנו (14 קבצים)

| קובץ | תיאור |
|------|-------|
| `InventoryItemCard.jsx` | שכתוב מלא - עיצוב KDS-style |
| `InventoryScreen.jsx` | RPC, שמות עובדים, קבלה ללא חשבונית |
| `KDSInventoryScreen.jsx` | RPC, שמירת שם משתמש |
| `TripleCheckCard.jsx` | **חדש** - כרטיס השוואת כמויות |
| `SmartStepper.jsx` | **חדש** - קומפוננטת סטפר חכם |
| `ocrService.js` | **חדש** - שירות OCR |
| `MenuEditModal.jsx` | recipe_step למתכונים |
| `useInvoiceOCR.js` | hook לסריקת חשבוניות |
| `grokService.js` | שילוב Grok Vision API |
| `geminiService.js` | שילוב Gemini Vision API |
| `DeliveryAddressModal.jsx` | שיפורי UI |
| `index.jsx` (manager) | שינויים קלים |
| `index.jsx` (ordering) | שינויים קלים |
| `CHANGELOG.md` | עדכון |

---

## ✅ מה לבדוק

1. **ספירת מלאי במנהל** - לשנות כמות, לחץ שמור, לרענן ולוודא שנשמר
2. **ספירת מלאי ב-KDS** - אותו בדיוק
3. **הצגת שם הסופר** - אחרי שמירה לראות את השם והתאריך
4. **קבלה ללא חשבונית** - לחיצה על "קבלה ללא חשבונית" בהזמנות נשלחו
5. **סריקת חשבונית** - להעלות תמונה ולראות שהפריטים מזוהים
6. **step values** - לבדוק שפולי קפה עובד עם step 0.5

---

**נדחף ל-GitHub:** ✅ `develop` branch
**Commit:** `a7c925c`
