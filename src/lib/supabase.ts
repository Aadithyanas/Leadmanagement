import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = 'https://qilkenpgzfzgmuzzdsgv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbGtlbnBnemZ6Z211enpkc2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzAxODIsImV4cCI6MjA5NjA0NjE4Mn0.WqtoKnj3J_WmZ5st-YZOMcMp1k3bMikAn-EOtHAiYwk';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
