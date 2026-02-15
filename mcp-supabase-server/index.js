#!/usr/bin/env node
/**
 * MCP Server for Supabase - Maya Hebrew Assistant
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.LOCAL_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.LOCAL_SUPABASE_SERVICE_KEY;
const BUSINESS_ID = process.env.BUSINESS_ID || '22222222-2222-2222-2222-222222222222';

if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const server = new Server({ name: 'maya-supabase', version: '1.0.0' }, { capabilities: { tools: {} } });

// Tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_today_sales',
      description: 'קבלי סיכום מכירות של היום',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'get_orders',
      description: 'קבלי הזמנות אחרונות',
      inputSchema: { 
        type: 'object', 
        properties: { 
          limit: { type: 'number', default: 10 },
          status: { type: 'string', enum: ['pending', 'completed', 'cancelled'] }
        } 
      }
    },
    {
      name: 'get_menu',
      description: 'קבלי את התפריט',
      inputSchema: { type: 'object', properties: { category: { type: 'string' } } }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    if (name === 'get_today_sales') {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('business_id', BUSINESS_ID)
        .gte('created_at', today)
        .eq('status', 'completed');
      
      if (error) throw error;
      
      const total = data.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      return { content: [{ type: 'text', text: `מכירות היום: ${data.length} הזמנות, סה"כ ${total.toFixed(2)} ש"ח` }] };
    }
    
    if (name === 'get_orders') {
      let query = supabase
        .from('orders')
        .select('order_number, total_amount, status, created_at')
        .eq('business_id', BUSINESS_ID)
        .order('created_at', { ascending: false })
        .limit(args.limit || 10);
      
      if (args.status) query = query.eq('status', args.status);
      
      const { data, error } = await query;
      if (error) throw error;
      
      const orders = data.map(o => `#${o.order_number}: ${o.total_amount}₪ (${o.status})`).join('\n');
      return { content: [{ type: 'text', text: orders || 'אין הזמנות' }] };
    }
    
    if (name === 'get_menu') {
      let query = supabase
        .from('menu_items')
        .select('name, price')
        .eq('business_id', BUSINESS_ID)
        .eq('is_available', true);
      
      const { data, error } = await query;
      if (error) throw error;
      
      const items = data.map(i => `${i.name}: ${i.price}₪`).join('\n');
      return { content: [{ type: 'text', text: items || 'אין פריטים' }] };
    }
    
    return { content: [{ type: 'text', text: 'פקודה לא מוכרת' }], isError: true };
  } catch (err) {
    return { content: [{ type: 'text', text: `שגיאה: ${err.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Maya MCP Server running');
