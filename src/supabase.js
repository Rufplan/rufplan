import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

`.env.local` (create this in the root folder — right-click **RUFPLAN** at the top of the sidebar, not `src`):
```
VITE_SUPABASE_URL=https://bajohwxzsgxmsrbrlyam.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJham9od3h6c2d4bXNyYnJseWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MjQ1MjMsImV4cCI6MjA4NzQwMDUyM30.fGedcRZIIN1yzRD5Ve9zKsic2LZnGpCkedBUHuMRxPI