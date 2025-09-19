import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase/client'

export async function POST() {
  const { error } = await supabase.auth.signOut()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ status: 200 })
}
