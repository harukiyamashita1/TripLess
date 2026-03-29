import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env[key]) return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    const cleanKey = key.replace('VITE_', '');
    if (process.env[cleanKey]) return process.env[cleanKey];
    if (process.env[key]) return process.env[key];
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl) {
  console.warn('SUPABASE_URL is missing. Database features will be disabled until configured.');
}

export const supabase = supabaseUrl 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;
