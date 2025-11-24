'use client'

import { SubjectEntity } from '@/types'
import { useTheme } from '@/lib/contexts/ThemeContext'

interface SubjectSelectorProps {
  subjects: SubjectEntity[]
  selectedSubject: string
  onSelectSubject: (subjectName: string) => void
  disabled?: boolean
}

export function SubjectSelector({
  subjects,
  selectedSubject,
  onSelectSubject,
  disabled = false,
}: SubjectSelectorProps) {
  const { colors } = useTheme()

  // 教科を分類
  const defaultSubject = subjects.find((s) => s.is_default)
  const builtinSubjects = subjects.filter((s) => s.is_builtin && !s.is_default)
  const customSubjects = subjects.filter((s) => !s.is_builtin && !s.is_default)

  // ボタンのスタイルを生成
  const getButtonStyle = (isSelected: boolean) => {
    if (isSelected) {
      return {
        backgroundColor: colors.primary,
        color: 'white',
      }
    }
    return {}
  }

  const getButtonClassName = (isSelected: boolean) => {
    const base = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
    if (isSelected) {
      return `${base} text-white`
    }
    return `${base} bg-white text-gray-700 border border-gray-300`
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* 上段：指定なし */}
      {defaultSubject && (
        <div className="flex justify-center">
          <button
            onClick={() => onSelectSubject(defaultSubject.subject_name)}
            disabled={disabled}
            className={getButtonClassName(selectedSubject === defaultSubject.subject_name)}
            style={getButtonStyle(selectedSubject === defaultSubject.subject_name)}
          >
            {defaultSubject.subject_name}
          </button>
        </div>
      )}

      {/* 2段目：初期教科 */}
      {builtinSubjects.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {builtinSubjects.map((subject) => (
            <button
              key={subject.subject_id}
              onClick={() => onSelectSubject(subject.subject_name)}
              disabled={disabled}
              className={getButtonClassName(selectedSubject === subject.subject_name)}
              style={getButtonStyle(selectedSubject === subject.subject_name)}
            >
              {subject.subject_name}
            </button>
          ))}
        </div>
      )}

      {/* 3段目：カスタム教科 */}
      {customSubjects.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {customSubjects.map((subject) => (
            <button
              key={subject.subject_id}
              onClick={() => onSelectSubject(subject.subject_name)}
              disabled={disabled}
              className={getButtonClassName(selectedSubject === subject.subject_name)}
              style={getButtonStyle(selectedSubject === subject.subject_name)}
            >
              {subject.subject_name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
