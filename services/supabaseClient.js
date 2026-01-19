
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjojacrssrdfbkcyfylf.supabase.co';
// De correcte Supabase Anon Key voor cloud-synchronisatie
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqb2phY3Jzc3JkZmJrY3lmeWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzk5NTIsImV4cCI6MjA4NDQxNTk1Mn0.6BdIXiYxdle38GWWaFQEvmUNw2GFvKB7bnfRGgrG73A'; 

let client;

try {
  // Initialiseer de echte Supabase client
  client = createClient(supabaseUrl, supabaseAnonKey);
} catch (e) {
  console.error("Kritieke Supabase Initialisatie Fout:", e);
  client = null;
}

export const supabase = client;
