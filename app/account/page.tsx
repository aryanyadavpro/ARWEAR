import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import AccountClient from "./section-client"

export default async function AccountPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: { get: (name) => cookieStore.get(name)?.value },
  })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/sign-in")
  }
  return <AccountClient userEmail={user.email ?? ""} />
}
