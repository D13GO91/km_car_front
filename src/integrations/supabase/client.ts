import { createClient } from '@supabase/supabase-js'

// Lê as variáveis do ambiente (Vite usa import.meta.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validação para garantir que as variáveis foram carregadas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram definidas. Crie um arquivo .env.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";