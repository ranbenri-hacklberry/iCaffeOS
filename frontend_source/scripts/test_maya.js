import { chatWithMaya } from '../backend/services/mayaService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

// Create a mock Supabase client for testing context retrieval if needed
// In a real integration test we might want to mock the DB or use a test DB
// For this quick check, we'll rely on the service's internal logic which handles DB connections

async function testMaya() {
    console.log('🧪 Starting Maya Connection Test...');

    // 1. Test Code/Technical Question (System Knowledge)
    console.log('\n----------------------------------------');
    console.log('1️⃣  Testing Technical Knowledge (Code/System)');
    const techMsg = { role: 'user', content: 'מי את ומה התפקיד שלך במערכת?' };
    try {
        const context = {
            businessId: '22222222-2222-2222-2222-222222222222',
            provider: 'google',
            employee: { id: 'test-user', name: 'TestUser', accessLevel: 'Owner' }
        };

        // Note: chatWithMaya signature: (messages, businessId, provider, employee, model)
        const techResponse = await chatWithMaya([techMsg], context.businessId, context.provider, context.employee, 'gemini-3-flash-preview');
        console.log('🤖 Maya Response:\n', techResponse.content);

        if (techResponse.content.includes('מאיה') || techResponse.content.includes('KDS')) {
            console.log('✅ Tech Personality Verification: PASSED');
        } else {
            console.log('⚠️ Tech Personality Verification: AMBIGUOUS - ' + techResponse.content.substring(0, 50) + '...');
        }
    } catch (err) {
        console.error('❌ Tech Test Failed:', err);
    }

    // 2. Test Inventory Knowledge (Database Context)
    console.log('\n----------------------------------------');
    console.log('2️⃣  Testing Inventory Knowledge (Database Context)');
    const invMsg = { role: 'user', content: 'מה מצב המלאי? האם חסר משהו?' };
    try {
        const invResponse = await chatWithMaya([invMsg], '22222222-2222-2222-2222-222222222222', 'google', { name: 'TestUser', accessLevel: 'Owner' }, 'gemini-3-flash-preview');
        console.log('🤖 Maya Response:\n', invResponse.content);

        if (invResponse.content.includes('מלאי') || invResponse.content.includes('חסר') || invResponse.content.includes('להזמין') || invResponse.content.includes('מוצר')) {
            console.log('✅ Inventory Context Verification: PASSED');
        } else {
            console.log('⚠️ Inventory Context Verification: AMBIGUOUS - ' + invResponse.content.substring(0, 50) + '...');
        }

    } catch (err) {
        console.error('❌ Inventory Test Failed:', err);
    }
}

testMaya();
