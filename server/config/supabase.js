const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://qriibawpjsbazglbwohn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY && !process.env.SUPABASE_SERVICE_KEY.includes('placeholder')
  ? process.env.SUPABASE_SERVICE_KEY
  : (process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_EIgjeOEIBpz97t6RnJ2J9g_Ni3XF39l');

// Only create client if valid credentials are provided
let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized for URL:', supabaseUrl);
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
