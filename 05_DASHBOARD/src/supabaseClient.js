import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log them temporarily to your terminal/browser console to test if Vite reads them
console.log("Supabase URL checking:", supabaseUrl);
console.log("Supabase Key checking:", supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);