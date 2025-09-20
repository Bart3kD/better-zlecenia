import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from './utils/supabase/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const path = url.pathname

  // ─── 1️⃣ NOT LOGGED IN → /login ──────────────
  if (!user) {
    if (path !== '/login') {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // ─── 2️⃣ LOGGED IN USERS SHOULDN’T SEE /login ──────────
  if (path === '/login') {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // ─── 3️⃣ FETCH PROFILE AND CHECK COMPLETION ─────────────
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, bio, grade_level')
    .eq('id', user.id)
    .maybeSingle()

  // treat missing or empty values as incomplete
  const isIncomplete =
    !profile ||
    !profile.full_name?.trim() ||
    !profile.grade_level

  // ─── 4️⃣ IF INCOMPLETE → /onboarding ────────────────────
  if (isIncomplete && path !== '/onboarding') {
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  // ─── 5️⃣ BLOCK COMPLETED USERS FROM /onboarding ─────────
  if (!isIncomplete && path === '/onboarding') {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
