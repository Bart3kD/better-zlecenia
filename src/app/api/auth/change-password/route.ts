import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/services'

export async function POST(req: NextRequest) {
  const { newPassword } = await req.json()
 
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ user: data.user })
}
