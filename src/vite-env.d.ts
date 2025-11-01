/// <reference types="vite/client" />

// Global constants defined at build time
declare const __ROUTE_MESSAGING_ENABLED__: boolean;

// Adicione as novas variáveis aqui
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_STRIPE_PUBLIC_KEY: string
  // ...outras variáveis de ambiente que você tiver
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}