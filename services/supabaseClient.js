
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjojacrssrdfbkcyfylf.supabase.co';
// Opmerking: Voor echte cloud sync is een Supabase Anon Key (startend met eyJ...) vereist.
const supabaseAnonKey = 'sb_publishable_88cjnINq-BALRhd66sdDwA_2UFDr_jj'; 

let client;

try {
  // We forceren de client aanmaak. Als de key ongeldig is, zullen API calls falen met een error, 
  // wat de gebruiker direct feedback geeft over de sync status in plaats van stilletjes lokaal te werken.
  client = createClient(supabaseUrl, supabaseAnonKey);
} catch (e) {
  console.error("Kritieke Supabase Initialisatie Fout:", e);
  // Minimale fallback om crashes te voorkomen, maar sync zal niet werken.
  client = { from: () => ({ select: () => ({ then: (cb) => cb({ data: [], error: e }) }) }) };
}

export const supabase = client;
