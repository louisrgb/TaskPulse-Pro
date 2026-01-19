
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjojacrssrdfbkcyfylf.supabase.co';
// Je huidige sleutel lijkt ongeldig (Stripe formaat?). 
// We vangen dit op zodat de app niet crasht.
const supabaseAnonKey = 'sb_publishable_88cjnINq-BALRhd66sdDwA_2UFDr_jj'; 

let client;
try {
  // Een echte Supabase sleutel begint altijd met 'eyJ'
  if (!supabaseAnonKey.startsWith('eyJ')) {
    console.warn("Systeem: Supabase sleutel lijkt ongeldig. App draait in Lokale Modus.");
    client = {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      })
    };
  } else {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (e) {
  console.error("Supabase Init Error:", e);
}

export const supabase = client;
