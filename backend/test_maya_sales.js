
import fetch from 'node-fetch';

async function testAsk() {
    console.log('⏳ שולח שאלה למאיה: "כמה מכירות היו בחודש האחרון?"...');
    try {
        const start = Date.now();
        const response = await fetch('http://localhost:3001/api/maya/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                businessId: '22222222-2222-2222-2222-222222222222', // UUID האמיתי של iCaffe
                messages: [
                    { role: 'user', content: 'מה הפריט הכי נמכר?' }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status} ${await response.text()}`);
        }

        const data = await response.json();
        const duration = ((Date.now() - start) / 1000).toFixed(1);

        console.log('---------------------------------------------------');
        console.log(`💬 תשובה (לקח ${duration} שניות):`);
        console.log(data.response); // זה הטקסט שחוזר ממאיה
        console.log('---------------------------------------------------');

    } catch (error) {
        console.error('❌ שגיאה:', error.message);
    }
}

testAsk();
