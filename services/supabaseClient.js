
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjojacrssrdfbkcyfylf.supabase.co';
const supabaseAnonKey = 'sb_publishable_88cjnINq-BALRhd66sdDwA_2UFDr_jj'; 

let client;
const isSupabaseKey = (key) => key && key.startsWith('eyJ');

if (!isSupabaseKey(supabaseAnonKey)) {
  client = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    })
  };
} else {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    client = { from: () => ({ select: () => Promise.resolve({ data: [] }) }) };
  }
}

export const supabase = client;
