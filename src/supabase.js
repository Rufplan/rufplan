import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bajohwxzsgxmsrbrlyan.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJham9od3h6c2d4bXNyYnJseWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MjQ1MjMsImV4cCI6MjA4NzQwMDUyM30.fGedcRZIIN1yzRD5Ve9zKsic2LZnGpCkedBUHuMRxPI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);