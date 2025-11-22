export type Subject = '算数' | '国語' | '理科' | '社会' | '指定なし'
export type Role = 'user' | 'admin'

export interface User {
  user_id: string
  email: string
  name: string | null
  role: Role
  created_at: string
  updated_at: string
}

export interface StudySession {
  session_id: string
  user_id: string
  subject: Subject
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  created_at: string
  updated_at: string
}

export interface DailySummary {
  date: string // YYYY-MM-DD
  total_minutes: number
  session_count: number
}
