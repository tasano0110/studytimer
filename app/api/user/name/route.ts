import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PUT /api/user/name - Update user name
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || name.length === 0 || name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be between 1 and 100 characters' },
        { status: 400 }
      )
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ name })
      .eq('user_id', authUser.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user name:', error)
      return NextResponse.json({ error: 'Failed to update name' }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error in PUT /api/user/name:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
