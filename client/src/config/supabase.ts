import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://qriibawpjsbazglbwohn.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_EIgjeOEIBpz97t6RnJ2J9g_Ni3XF39l';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
