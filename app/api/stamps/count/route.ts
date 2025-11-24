import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/stamps/count - Get stamp count for the current user
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { count, error } = await supabase
      .from('stamps')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching stamp count:', error)
      return NextResponse.json({ error: 'Failed to fetch stamp count' }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error('Error in GET /api/stamps/count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
