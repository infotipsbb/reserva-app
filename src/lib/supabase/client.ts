// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail-fast: Si faltan variables, detenemos la ejecución con un error claro.
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Faltan las variables de entorno de Supabase. Verifica tu archivo .env"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}