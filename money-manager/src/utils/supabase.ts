import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nrkedfusuldutjqtuhbv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ya2VkZnVzdWxkdXRqcXR1aGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzgyMTUsImV4cCI6MjEwMTM1NDIxNX0.RM4ZRxjzdk1i11cpBeFbN99pWF2mt4nMNK5MbyU9etg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'moneymanager_supabase_auth_token',
  },
});
