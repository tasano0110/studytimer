import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// PUT /api/subjects/[id] - Update a subject
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

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

    // Check if subject exists and belongs to user
    const { data: existing } = await supabase
      .from('subjects')
      .select('*')
      .eq('subject_id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // Cannot edit default subject name
    if (existing.is_default) {
      return NextResponse.json(
        { error: 'Cannot edit default subject' },
        { status: 400 }
      )
    }

    // Check if another subject with the same name exists
    const { data: duplicate } = await supabase
      .from('subjects')
      .select('subject_id')
      .eq('user_id', user.id)
      .eq('subject_name', subject_name)
      .neq('subject_id', id)
      .single()

    if (duplicate) {
      return NextResponse.json(
        { error: 'Subject with this name already exists' },
        { status: 400 }
      )
    }

    // Update the subject
    const { data: subject, error } = await supabase
      .from('subjects')
      .update({ subject_name })
      .eq('subject_id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating subject:', error)
      return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 })
    }

    return NextResponse.json({ subject })
  } catch (error) {
    console.error('Error in PUT /api/subjects/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/subjects/[id] - Delete a subject
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if subject exists and belongs to user
    const { data: existing } = await supabase
      .from('subjects')
      .select('*')
      .eq('subject_id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // Cannot delete default subject
    if (existing.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default subject' },
        { status: 400 }
      )
    }

    // Get default subject to reassign sessions
    const { data: defaultSubject } = await supabase
      .from('subjects')
      .select('subject_id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    if (!defaultSubject) {
      return NextResponse.json(
        { error: 'Default subject not found' },
        { status: 500 }
      )
    }

    // Update all sessions using this subject to use default subject
    await supabase
      .from('study_sessions')
      .update({ subject_id: defaultSubject.subject_id })
      .eq('subject_id', id)
      .eq('user_id', user.id)

    // Delete the subject
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('subject_id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting subject:', error)
      return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/subjects/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
