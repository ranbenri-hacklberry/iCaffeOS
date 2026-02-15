/**
 * סקריפט לשליפת כל הלקוחות
 * הרצה: node scripts/list_customers.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const BUSINESS_ID = '22222222-2222-2222-2222-222222222222';

async function listCustomers() {
    console.log('👥 לקוחות לעסק:', BUSINESS_ID);
    console.log('=' .repeat(50));

    // שליפת לקוחות מטבלת customers
    const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', BUSINESS_ID);

    if (custError) {
        console.error('Error fetching customers:', custError);
    } else if (customers && customers.length > 0) {
        console.log('\n📋 טבלת customers:');
        customers.forEach((c, i) => {
            console.log(`${i + 1}. ${c.name || c.customer_name || 'N/A'} | ${c.phone_number || c.phone || 'N/A'} | ID: ${c.id}`);
        });
    } else {
        console.log('\n❌ אין לקוחות בטבלת customers');
    }

    // שליפת שמות לקוחות ייחודיים מהזמנות
    const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('customer_name, customer_phone')
        .eq('business_id', BUSINESS_ID)
        .not('customer_name', 'is', null);

    if (orderError) {
        console.error('Error fetching from orders:', orderError);
    } else if (orders && orders.length > 0) {
        const uniqueCustomers = [...new Map(
            orders.map(o => [o.customer_name, o])
        ).values()];

        console.log('\n📋 לקוחות ייחודיים מטבלת orders:');
        uniqueCustomers.forEach((c, i) => {
            console.log(`${i + 1}. ${c.customer_name} | ${c.customer_phone || 'N/A'}`);
        });
        console.log(`\nסה"כ: ${uniqueCustomers.length} לקוחות ייחודיים`);
    }
}

listCustomers()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
