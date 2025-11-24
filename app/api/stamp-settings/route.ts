import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/stamp-settings - Get stamp settings for the current user
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: settings, error } = await supabase
      .from('user_stamp_settings')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching stamp settings:', error)
      return NextResponse.json({ error: 'Failed to fetch stamp settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error in GET /api/stamp-settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/stamp-settings - Update stamp settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { weekday_minutes, weekend_minutes } = body

    if (
      !weekday_minutes ||
      !weekend_minutes ||
      weekday_minutes < 60 ||
      weekend_minutes < 60
    ) {
      return NextResponse.json(
        { error: 'Required minutes must be at least 60' },
        { status: 400 }
      )
    }

    // Update weekday setting
    const { error: weekdayError } = await supabase
      .from('user_stamp_settings')
      .update({ required_minutes: weekday_minutes })
      .eq('user_id', user.id)
      .eq('day_type', 'weekday')

    if (weekdayError) {
      console.error('Error updating weekday stamp settings:', weekdayError)
      return NextResponse.json(
        { error: 'Failed to update weekday stamp settings' },
        { status: 500 }
      )
    }

    // Update weekend setting
    const { error: weekendError } = await supabase
      .from('user_stamp_settings')
      .update({ required_minutes: weekend_minutes })
      .eq('user_id', user.id)
      .eq('day_type', 'weekend')

    if (weekendError) {
      console.error('Error updating weekend stamp settings:', weekendError)
      return NextResponse.json(
        { error: 'Failed to update weekend stamp settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/stamp-settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
