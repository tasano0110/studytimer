import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/user - Get current user info
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', authUser.id)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error in GET /api/user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
