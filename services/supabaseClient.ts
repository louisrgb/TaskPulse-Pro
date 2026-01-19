
import { createClient } from '@supabase/supabase-js';

// Verbinding met jouw specifieke Supabase project
const supabaseUrl = 'https://cjojacrssrdfbkcyfylf.supabase.co';
const supabaseAnonKey = 'sb_publishable_88cjnINq-BALRhd66sdDwA_2UFDr_jj'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
