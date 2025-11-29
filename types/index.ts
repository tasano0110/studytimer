export type Subject = '算数' | '国語' | '理科' | '社会' | '指定なし'
export type Role = 'user' | 'admin'
export type DayType = 'weekday' | 'weekend'
export type ColorTheme = 'slate' | 'teal' | 'blue' | 'pink'

export interface User {
  user_id: string
  email: string
  name: string | null
  role: Role
  created_at: string
  updated_at: string
}

export interface SubjectEntity {
  subject_id: string
  user_id: string
  subject_name: string
  display_order: number
  is_default: boolean
  is_builtin: boolean
  color_class: string | null
  created_at: string
  updated_at: string
}

export interface StudySession {
  session_id: string
  user_id: string
  subject: Subject
  subject_id?: string | null // New field for migration
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
  has_stamp?: boolean // New field for stamp display
}

export interface UserMessageSetting {
  setting_id: string
  user_id: string
  day_type: DayType
  threshold_minutes: number
  message: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface Stamp {
  stamp_id: string
  user_id: string
  earned_date: string // YYYY-MM-DD
  total_minutes: number
  created_at: string
}

export interface UserStampSetting {
  setting_id: string
  user_id: string
  day_type: DayType
  required_minutes: number
  created_at: string
  updated_at: string
}

export interface UserPreference {
  preference_id: string
  user_id: string
  color_theme: ColorTheme
  created_at: string
  updated_at: string
}
