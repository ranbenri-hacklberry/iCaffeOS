require('dotenv').config({ path: '/Users/user/.gemini/antigravity/scratch/my_app/frontend_source/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findSfatMidbar() {
  console.log('🔍 מחפש את "שפת מדבר"...');

  // חיפוש בטבלת העסקים
  const { data: businesses, error: bError } = await supabase
    .from('businesses')
    .select('*')
    .or('name.ilike.%שפת מדבר%,name.ilike.%sfat midbar%');

  if (bError) {
    console.error('שגיאה בחיפוש עסקים:', bError);
    return;
  }

  if (businesses.length === 0) {
    console.log('❌ לא נמצא עסק בשם "שפת מדבר" בבסיס הנתונים הראשי.');
  } else {
    for (const b of businesses) {
      console.log(`✅ נמצא עסק: ${b.name} (ID: ${b.id})`);
      console.log('Settings:', JSON.stringify(b.settings, null, 2));
      
      // חיפוש דומיינים/הגדרות ורסל בהגדרות
      if (b.settings && b.settings.subdomain) {
          console.log(`🔗 תת-דומיין: ${b.settings.subdomain}`);
      }

      // בדיקה אם יש מחיצות או פריטים
      const { count: itemCount } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', b.id);
      
      console.log(`📦 מספר פריטים בתפריט: ${itemCount || 0}`);
    }
  }

  // חיפוש רמזים בטבלאות אחרות אם יש (למשל סאב-דומיינים ייעודיים)
  console.log('\n🔍 מחפש רמזים נוספים לדומיינים של Vercel...');
  // (כאן אפשר להוסיף שאילתות נוספות אם יש טבלאות רלוונטיות)
}

findSfatMidbar();
