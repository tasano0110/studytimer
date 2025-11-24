import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/subjects - Get all subjects for the current user
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching subjects:', error)
      return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
    }

    return NextResponse.json({ subjects })
  } catch (error) {
    console.error('Error in GET /api/subjects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/subjects - Create a new subject
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subject_name } = body

    if (!subject_name || subject_name.length === 0 || subject_name.length > 20) {
      return NextResponse.json(
        { error: 'Subject name must be between 1 and 20 characters' },
        { status: 400 }
      )
    }

    // Check if subject already exists
    const { data: existing } = await supabase
      .from('subjects')
      .select('subject_id')
      .eq('user_id', user.id)
      .eq('subject_name', subject_name)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Subject with this name already exists' },
        { status: 400 }
      )
    }

    // Get the max display_order
    const { data: maxOrder } = await supabase
      .from('subjects')
      .select('display_order')
      .eq('user_id', user.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const newDisplayOrder = maxOrder ? maxOrder.display_order + 1 : 0

    // Create the subject
    const { data: subject, error } = await supabase
      .from('subjects')
      .insert({
        user_id: user.id,
        subject_name,
        display_order: newDisplayOrder,
        is_default: false,
        is_builtin: false,
        color_class: 'bg-gray-100 text-gray-800',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating subject:', error)
      return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 })
    }

    return NextResponse.json({ subject }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/subjects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
