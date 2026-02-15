# 🔐 הגדרת OAuth לGoogle Drive - מדריך מהיר

## צעד 1: יצירת OAuth Credentials

1. **פתח את Google Cloud Console:**
   <https://console.cloud.google.com/apis/credentials>

2. **בחר או צור פרויקט:**
   - אם יש לך כבר (`repos-477613`), השתמש בו
   - אחרת, לחץ "CREATE PROJECT" בראש העמוד

3. **אפשר את Drive API:**
   - לך ל: <https://console.cloud.google.com/apis/library/drive.googleapis.com>
   - לחץ "ENABLE"

4. **צור OAuth Client ID:**
   - חזור ל: <https://console.cloud.google.com/apis/credentials>
   - לחץ "+ CREATE CREDENTIALS" > "OAuth client ID"
   - **Application type:** Desktop app
   - **Name:** "Project Backup Upload" (או כל שם)
   - לחץ "CREATE"

5. **הורד את הקובץ:**
   - אחרי היצירה, תופיע חלונית עם אפשרות "DOWNLOAD JSON"
   - לחץ על הכפתור להורדה
   - שמור את הקובץ בשם **`credentials.json`** בתיקיית הפרויקט

## צעד 2: הרץ את העלאה

```bash
# ודא שההתקנה הסתיימה
pip list | grep google

# הרץ את הסקריפט
python3 upload_oauth.py
```

## מה יקרה

1. יפתח דפדפן אוטומטית ✅
2. תתבקש להתחבר לחשבון Google שלך 🔐
3. תתבקש לאשר גישה ל-Drive ✔️
4. הסקריפט יתחיל להעלות קבצים 📤
5. ההרשאה נשמרת ב-`token.pickle` לפעם הבאה 💾

## טיפים

- **הפעם הראשונה:** דפדפן יפתח לאישור
- **פעמים הבאות:** יעבוד אוטומטית ללא אישור
- **התקדמות:** הסקריפט מדפיס התקדמות כל 50 קבצים
- **שגיאות:** אם יש תקלה, הוא ימשיך לקובץ הבא

## אחרי ההעלאה

הקבצים יהיו זמינים ישירות ב-Drive בתיקייה שלך, וGemini יוכל לקרוא אותם! 🎉
