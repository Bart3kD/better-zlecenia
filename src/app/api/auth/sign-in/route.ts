import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password, })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ user: data.user })
}
