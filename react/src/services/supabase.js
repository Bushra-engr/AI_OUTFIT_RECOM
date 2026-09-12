import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fbzpnnuaamdxmhzsxosn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZienBubnVhYW1keG1oenN4b3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5OTUzNDMsImV4cCI6MjEwMzU3MTM0M30.9gy1_TuXMrz8DOr32xrvK0M1-OiQcQN7a8swqQHUN2g';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
