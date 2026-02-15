// Test if match_employee_face RPC exists in database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testRPC() {
  console.log('🔍 Testing match_employee_face RPC function...\n');

  // Create a dummy 128-dimensional embedding
  const dummyEmbedding = Array(128).fill(0.1);
  const vectorString = `[${dummyEmbedding.join(',')}]`;

  try {
    const { data, error } = await supabase.rpc('match_employee_face', {
      embedding: vectorString,
      match_threshold: 0.4,
      match_count: 1
    });

    if (error) {
      console.error('❌ RPC Error:', error);
      console.error('\n📝 This means the function does NOT exist in the database!');
      console.error('   You need to run the migration manually in Supabase Dashboard.\n');
      process.exit(1);
    }

    console.log('✅ RPC function exists!');
    console.log('📊 Results:', data);

    if (data.length === 0) {
      console.log('\n⚠️  No employees with face embeddings found.');
      console.log('   Go to /admin/enroll-face to register a face.\n');
    }

  } catch (err) {
    console.error('❌ Connection error:', err.message);
  }
}

testRPC();
