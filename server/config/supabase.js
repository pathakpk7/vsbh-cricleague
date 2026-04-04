const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder_key';

// Only create client if valid credentials are provided
let supabase = null;

if (supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co') {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  } catch (error) {
    console.warn('Failed to initialize Supabase:', error.message);
  }
} else {
  console.warn('⚠️  Supabase not configured. Using mock client. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
  // Provide a mock client object that won't crash on null operations
  supabase = {
    from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
    auth: { getSession: () => Promise.resolve({ data: { session: null }, error: null }) }
  };
}

module.exports = supabase;
module.exports.supabase = supabase;
