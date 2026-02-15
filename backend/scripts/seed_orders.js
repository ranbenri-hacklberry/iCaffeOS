/**
 * סקריפט להזרקת הזמנות לעסק iCaffe
 * הרצה: node scripts/seed_orders.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const BUSINESS_ID = '22222222-2222-2222-2222-222222222222';

// שמות לקוחות
const CUSTOMERS = [
    { name: 'דני לוי', phone: '0501234567' },
    { name: 'מיכל כהן', phone: '0502345678' },
    { name: 'יוסי אברהם', phone: '0503456789' },
    { name: 'נתי גולדשטיין', phone: '0504567890' }, // VIP!
    { name: 'רונית בר', phone: '0505678901' },
    { name: 'אבי מזרחי', phone: '0506789012' },
    { name: 'שרה דוד', phone: '0507890123' },
    { name: 'משה יעקב', phone: '0508901234' },
];

// פריטי תפריט
const MENU_ITEMS = [
    { id: 10, name: 'אספרסו קצר', price: 12 },
    { id: 11, name: 'אספרסו כפול', price: 14 },
    { id: 19, name: 'נס על חלב', price: 16 },
    { id: 20, name: 'קפה שחור', price: 10 },
    { id: 22, name: 'קפה קר', price: 18 },
    { id: 30, name: 'הפוך גדול', price: 18 },
    { id: 31, name: 'הפוך קטן', price: 14 },
    { id: 40, name: 'לאטה', price: 20 },
    { id: 50, name: 'קרואסון', price: 15 },
    { id: 51, name: 'עוגת שוקולד', price: 22 },
];

// Helper functions
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function createOrder(date, status = 'completed') {
    const customer = randomItem(CUSTOMERS);
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${randomInt(100, 999)}`;
    const numItems = randomInt(1, 4);

    // חשב סה"כ
    let totalAmount = 0;
    const items = [];
    for (let i = 0; i < numItems; i++) {
        const menuItem = randomItem(MENU_ITEMS);
        const qty = randomInt(1, 2);
        const itemTotal = menuItem.price * qty;
        totalAmount += itemTotal;
        items.push({
            menu_item_id: menuItem.id,
            item_name: menuItem.name,
            quantity: qty,
            unit_price: menuItem.price,
            total_price: itemTotal,
            item_status: status,
        });
    }

    const orderId = randomUUID();

    // צור הזמנה
    const { error: orderError } = await supabase.from('orders').insert({
        id: orderId,
        business_id: BUSINESS_ID,
        order_number: orderNumber,
        customer_name: customer.name,
        customer_phone: customer.phone,
        order_status: status,
        is_paid: status === 'completed' ? true : Math.random() > 0.3,
        payment_method: randomItem(['cash', 'credit', 'bit']),
        total_amount: totalAmount,
        created_at: date.toISOString(),
        updated_at: date.toISOString(),
    });

    if (orderError) {
        console.error('Error creating order:', orderError);
        return null;
    }

    // צור פריטי הזמנה
    for (const item of items) {
        const { error: itemError } = await supabase.from('order_items').insert({
            id: randomUUID(),
            order_id: orderId,
            business_id: BUSINESS_ID,
            menu_item_id: item.menu_item_id,
            item_name: item.item_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            item_status: item.item_status,
            created_at: date.toISOString(),
        });

        if (itemError) {
            console.error('Error creating order item:', itemError);
        }
    }

    return { orderId, orderNumber, totalAmount, customer: customer.name };
}

async function seedOrders() {
    console.log('🌱 מתחיל להזריק הזמנות לעסק:', BUSINESS_ID);
    console.log('=' .repeat(50));

    const now = new Date();
    let totalOrders = 0;
    let totalRevenue = 0;

    // ==========================================
    // 1. הזמנות מחודש שעבר (ינואר) - 50 הזמנות
    // ==========================================
    console.log('\n📅 יוצר הזמנות מחודש שעבר (ינואר)...');
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    for (let i = 0; i < 50; i++) {
        const day = randomInt(1, 28);
        const hour = randomInt(7, 20);
        const date = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), day, hour, randomInt(0, 59));
        const order = await createOrder(date, 'completed');
        if (order) {
            totalOrders++;
            totalRevenue += order.totalAmount;
            process.stdout.write(`\r   נוצרו ${i + 1}/50 הזמנות`);
        }
    }
    console.log(' ✅');

    // ==========================================
    // 2. הזמנות מהשבוע הנוכחי - 15 הזמנות
    // ==========================================
    console.log('\n📅 יוצר הזמנות מהשבוע...');
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 15; i++) {
        const dayOffset = randomInt(0, 6);
        const hour = randomInt(7, 20);
        const date = new Date(weekAgo.getTime() + dayOffset * 24 * 60 * 60 * 1000);
        date.setHours(hour, randomInt(0, 59));
        const status = randomItem(['completed', 'ready', 'in_progress']);
        const order = await createOrder(date, status);
        if (order) {
            totalOrders++;
            totalRevenue += order.totalAmount;
            process.stdout.write(`\r   נוצרו ${i + 1}/15 הזמנות`);
        }
    }
    console.log(' ✅');

    // ==========================================
    // 3. הזמנות מהיום - 8 הזמנות
    // ==========================================
    console.log('\n📅 יוצר הזמנות מהיום...');
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (let i = 0; i < 8; i++) {
        const hour = randomInt(7, Math.min(now.getHours(), 20));
        const date = new Date(today);
        date.setHours(hour, randomInt(0, 59));
        const status = randomItem(['new', 'in_progress', 'ready', 'completed']);
        const order = await createOrder(date, status);
        if (order) {
            totalOrders++;
            totalRevenue += order.totalAmount;
            console.log(`   ${i + 1}. ${order.orderNumber} - ${order.customer} - ${order.totalAmount} ש"ח (${status})`);
        }
    }

    // ==========================================
    // סיכום
    // ==========================================
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 סיום!');
    console.log(`   📦 סה"כ הזמנות: ${totalOrders}`);
    console.log(`   💰 סה"כ הכנסות: ${totalRevenue} ש"ח`);
    console.log('=' .repeat(50));

    // בדיקת סנכרון
    const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', BUSINESS_ID);

    console.log(`\n✅ אימות: נמצאו ${count} הזמנות ב-DB`);
}

// הרצה
seedOrders()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
