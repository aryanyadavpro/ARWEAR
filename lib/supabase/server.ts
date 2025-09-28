import { createServerClient } from "@supabase/ssr"

export function getSupabaseServer(serviceRole = false) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRole ? process.env.SUPABASE_SERVICE_ROLE_KEY! : process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}
