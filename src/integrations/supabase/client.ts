import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iducujpaclvycaplolxo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkdWN1anBhY2x2eWNhcGxvbHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDc5NjQsImV4cCI6MjA3NzU4Mzk2NH0.kEcUlye7ijwR3AGS2NCTiRZBGImmlcIK1RE0gmEmcCU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
