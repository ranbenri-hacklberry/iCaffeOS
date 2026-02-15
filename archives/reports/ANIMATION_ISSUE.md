# בעיה: אנימציות קופצות ומהבהבות ברשימת משימות

## תיאור הבעיה
יש לי רשימת משימות ב-React שמשתמשת ב-Framer Motion. כשמסמנים משימה כהושלמה, היא נעלמת מהרשימה, והמשימות שנותרות "קופצות" למעלה/למטה ומהבהבות.

רציתי אנימציה חלקה ועדינה של fade out איטי כשמשימה נעלמת, בלי שהמשימות האחרות יזוזו בצורה פתאומית.

## הקוד הנוכחי

### TaskManagementView.jsx (מסך Prep)
```javascript
import { motion, AnimatePresence } from 'framer-motion';

const TaskRow = ({ task }) => (
    <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{
            opacity: { duration: 0.3 },
            height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
        }}
        onClick={() => setSelectedTask(task)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all
            ${selectedTask?.id === task.id
                ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-100'
                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
            }`}
    >
        {/* תוכן הכרטיס */}
    </motion.div>
);

// שימוש:
<div className="grid grid-cols-2 gap-3">
    <AnimatePresence mode="popLayout">
        {tasks.map(task => <TaskRow key={task.id} task={task} />)}
    </AnimatePresence>
</div>
```

### TasksManager.jsx (מסך Manager)
```javascript
<AnimatePresence mode="popLayout">
{sortedTasks.map(task => {
    return (
        <motion.div
            key={task.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
                opacity: { duration: 0.3 },
                height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
            }}
            className="bg-white rounded-xl shadow-sm border p-2 pr-2 flex items-center gap-3 relative transition-all cursor-pointer group h-[88px] hover:shadow-md"
        >
            {/* תוכן הכרטיס */}
        </motion.div>
    );
})}
</AnimatePresence>
```

## מה ניסיתי
1. ✅ הוספתי `layout` prop - גרם להבהובים חזקים
2. ✅ שיניתי מ-`scale` ל-`y` - עדיין קפץ
3. ✅ האטתי את האנימציות (0.5s במקום 0.3s) - עדיין לא חלק
4. ✅ שיניתי ל-`height: 0` במקום `y` - עדיין קופץ

## מה אני רוצה
אנימציה חלקה ועדינה כש:
1. משימה נעלמת - fade out איטי (0.5s לפחות)
2. המשימות שנשארות - זזות למעלה בצורה חלקה מאוד, לא קופצות
3. בלי הבהובים או "jumps"

האם יש דרך טובה יותר לעשות את זה ב-Framer Motion? או אולי צריך להשתמש בספרייה אחרת?
