import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DayType } from '@/types'

// GET /api/message-settings - Get message settings for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dayType = searchParams.get('day_type') as DayType | null

    let query = supabase
      .from('user_message_settings')
      .select('*')
      .eq('user_id', user.id)

    if (dayType) {
      query = query.eq('day_type', dayType)
    }

    const { data: settings, error } = await query.order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching message settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch message settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error in GET /api/message-settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/message-settings - Update message settings
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
    const { day_type, settings } = body

    if (!day_type || !settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Validate settings
    for (let i = 0; i < settings.length; i++) {
      const setting = settings[i]
      if (!setting.message || setting.message.length === 0 || setting.message.length > 50) {
        return NextResponse.json(
          { error: 'Message must be between 1 and 50 characters' },
          { status: 400 }
        )
      }
      if (i > 0 && setting.threshold_minutes <= settings[i - 1].threshold_minutes) {
        return NextResponse.json(
          { error: 'Threshold minutes must be in ascending order' },
          { status: 400 }
        )
      }
    }

    // Delete existing settings for this day_type
    await supabase
      .from('user_message_settings')
      .delete()
      .eq('user_id', user.id)
      .eq('day_type', day_type)

    // Insert new settings
    const newSettings = settings.map((setting: any, index: number) => ({
      user_id: user.id,
      day_type,
      threshold_minutes: setting.threshold_minutes,
      message: setting.message,
      display_order: index + 1,
    }))

    const { error } = await supabase.from('user_message_settings').insert(newSettings)

    if (error) {
      console.error('Error updating message settings:', error)
      return NextResponse.json(
        { error: 'Failed to update message settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/message-settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
