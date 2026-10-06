'use client';
import { createBrowserClient } from '@supabase/ssr';
import { supabaseConfig } from './config';
export function getBrowserSupabase() {
  const config = supabaseConfig();
  if (!config) throw new Error('Configure Supabase before signing in.');
  return createBrowserClient(config.url, config.key);
}
