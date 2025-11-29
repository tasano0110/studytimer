import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ColorTheme } from '@/types'

// GET /api/preferences - Get user preferences
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: preference, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching preferences:', error)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    return NextResponse.json({ preference })
  } catch (error) {
    console.error('Error in GET /api/preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/preferences - Update user preferences
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
    const { color_theme } = body

    if (color_theme && !['slate', 'teal', 'blue', 'pink'].includes(color_theme)) {
      return NextResponse.json({ error: 'Invalid color theme' }, { status: 400 })
    }

    // Check if preference already exists
    const { data: existingPreference } = await supabase
      .from('user_preferences')
      .select('preference_id')
      .eq('user_id', user.id)
      .single()

    let preference
    let error

    if (existingPreference) {
      // Update existing preference
      const result = await supabase
        .from('user_preferences')
        .update({ color_theme })
        .eq('user_id', user.id)
        .select()
        .single()
      preference = result.data
      error = result.error
    } else {
      // Insert new preference
      const result = await supabase
        .from('user_preferences')
        .insert({ user_id: user.id, color_theme })
        .select()
        .single()
      preference = result.data
      error = result.error
    }

    if (error) {
      console.error('Error updating preferences:', error)
      return NextResponse.json({
        error: 'Failed to update preferences',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({ preference })
  } catch (error) {
    console.error('Error in PUT /api/preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
