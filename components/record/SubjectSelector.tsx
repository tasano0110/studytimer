'use client'

import { Subject } from '@/types'

const subjects: Subject[] = ['指定なし', '算数', '国語', '理科', '社会']

interface SubjectSelectorProps {
  selectedSubject: Subject
  onSelectSubject: (subject: Subject) => void
  disabled?: boolean
}

export function SubjectSelector({
  selectedSubject,
  onSelectSubject,
  disabled = false,
}: SubjectSelectorProps) {
  const mainSubjects = subjects.slice(1) // 算数〜社会

  return (
    <div className="flex flex-col items-center gap-2">
      {/* 上段：指定なしのみ */}
      <div className="flex justify-center">
        <button
          key="指定なし"
          onClick={() => onSelectSubject('指定なし')}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            selectedSubject === '指定なし'
              ? 'bg-[#003c68] text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-[#003c68]/5'
          }`}
        >
          指定なし
        </button>
      </div>

      {/* 下段：算数〜社会 */}
      <div className="flex flex-wrap justify-center gap-2">
        {mainSubjects.map((subject) => (
          <button
            key={subject}
            onClick={() => onSelectSubject(subject)}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedSubject === subject
                ? 'bg-[#003c68] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-[#003c68]/5'
            }`}
          >
            {subject}
          </button>
        ))}
      </div>
    </div>
  )
}
