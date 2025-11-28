import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    // バリデーション
    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上である必要があります' },
        { status: 400 }
      )
    }

    // サービスロールキーを使用してadmin APIでユーザーを作成
    // これによりトリガーに依存せずに確実にユーザーを作成できる
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Admin APIを使用してユーザーを作成
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // メール確認をスキップ（開発環境用）
      user_metadata: {
        name: name || '',
      },
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      return NextResponse.json(
        { error: authError.message || '登録に失敗しました' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      console.error('No user returned from signup')
      return NextResponse.json(
        { error: '登録に失敗しました' },
        { status: 500 }
      )
    }

    console.log('User created in auth.users:', authData.user.id)

    // トリガーが実行されるまで少し待つ
    await new Promise((resolve) => setTimeout(resolve, 500))

    // usersテーブルにレコードが作成されているか確認
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()

    if (userError || !userData) {
      console.warn('User not found in users table, creating manually:', userError?.message)

      // トリガーが動作しなかった場合、手動で作成
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          user_id: authData.user.id,
          email: authData.user.email,
          name: name || '',
          role: 'user',
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create user record:', insertError)

        // 既に存在する場合はエラーを無視
        if (insertError.code !== '23505') { // unique_violation
          return NextResponse.json(
            {
              error: 'ユーザー情報の保存に失敗しました',
              details: insertError.message,
            },
            { status: 500 }
          )
        }
      } else {
        console.log('User record created manually:', newUser)
      }
    } else {
      console.log('User record found in users table:', userData)
    }

    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: false,
      message: '登録が完了しました',
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      {
        error: '登録に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー',
      },
      { status: 500 }
    )
  }
}
