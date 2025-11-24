'use client'

import { useState, useEffect } from 'react'
import { SubjectEntity } from '@/types'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { Pencil, Trash2, Plus } from 'lucide-react'

export default function SubjectSettings() {
  const [subjects, setSubjects] = useState<SubjectEntity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentSubject, setCurrentSubject] = useState<SubjectEntity | null>(null)
  const [subjectName, setSubjectName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadSubjects()
  }, [])

  const loadSubjects = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/subjects')
      if (response.ok) {
        const data = await response.json()
        setSubjects(data.subjects || [])
      }
    } catch (error) {
      console.error('Failed to load subjects:', error)
      toast.error('教科の読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async () => {
    if (subjectName.length === 0 || subjectName.length > 20) {
      toast.error('教科名は1文字以上20文字以内で入力してください')
      return
    }

    if (subjects.some((s) => s.subject_name === subjectName)) {
      toast.error('同じ名前の教科が既に存在します')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_name: subjectName }),
      })

      if (response.ok) {
        toast.success('教科を追加しました')
        setShowAddModal(false)
        setSubjectName('')
        loadSubjects()
      } else {
        throw new Error('Failed to add')
      }
    } catch (error) {
      console.error('Failed to add subject:', error)
      toast.error('教科の追加に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!currentSubject) return

    if (subjectName.length === 0 || subjectName.length > 20) {
      toast.error('教科名は1文字以上20文字以内で入力してください')
      return
    }

    if (subjects.some((s) => s.subject_name === subjectName && s.subject_id !== currentSubject.subject_id)) {
      toast.error('同じ名前の教科が既に存在します')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/subjects/${currentSubject.subject_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_name: subjectName }),
      })

      if (response.ok) {
        toast.success('教科を更新しました')
        setShowEditModal(false)
        setCurrentSubject(null)
        setSubjectName('')
        loadSubjects()
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      console.error('Failed to update subject:', error)
      toast.error('教科の更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentSubject) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/subjects/${currentSubject.subject_id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('教科を削除しました')
        setShowDeleteConfirm(false)
        setCurrentSubject(null)
        loadSubjects()
      } else {
        throw new Error('Failed to delete')
      }
    } catch (error) {
      console.error('Failed to delete subject:', error)
      toast.error('教科の削除に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (subject: SubjectEntity) => {
    setCurrentSubject(subject)
    setSubjectName(subject.subject_name)
    setShowEditModal(true)
  }

  const openDeleteConfirm = (subject: SubjectEntity) => {
    setCurrentSubject(subject)
    setShowDeleteConfirm(true)
  }

  if (isLoading) {
    return <div className="text-center py-8 text-gray-600">読み込み中...</div>
  }

  const defaultSubject = subjects.find((s) => s.is_default)
  const builtinSubjects = subjects.filter((s) => s.is_builtin && !s.is_default)
  const customSubjects = subjects.filter((s) => !s.is_builtin && !s.is_default)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">教科設定</h2>
      <p className="text-sm text-gray-600 mb-6">
        学習セッションで選択できる教科を管理できます。
      </p>

      {/* Default Subject */}
      {defaultSubject && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">デフォルト</h3>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <span className="font-medium">{defaultSubject.subject_name}</span>
            <span className="text-sm text-gray-500 ml-2">（削除不可）</span>
          </div>
        </div>
      )}

      {/* Builtin Subjects */}
      {builtinSubjects.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">初期教科</h3>
          <div className="space-y-2">
            {builtinSubjects.map((subject) => (
              <div
                key={subject.subject_id}
                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
              >
                <span className="font-medium">{subject.subject_name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(subject)}
                    className="p-2 text-gray-600 hover:text-[#003c68] transition-colors"
                    title="編集"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(subject)}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Subjects */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">追加した教科</h3>
        {customSubjects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            まだ教科が追加されていません
          </div>
        ) : (
          <div className="space-y-2">
            {customSubjects.map((subject) => (
              <div
                key={subject.subject_id}
                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
              >
                <span className="font-medium">{subject.subject_name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(subject)}
                    className="p-2 text-gray-600 hover:text-[#003c68] transition-colors"
                    title="編集"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(subject)}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Button */}
      <Button
        onClick={() => setShowAddModal(true)}
        className="inline-flex items-center whitespace-nowrap"
      >
        <Plus className="w-4 h-4 mr-2" />
        教科を追加
      </Button>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setSubjectName('')
        }}
        title="教科を追加"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            教科名（{subjectName.length}/20文字）
          </label>
          <input
            type="text"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            maxLength={20}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003c68]"
            placeholder="教科名を入力"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddModal(false)
              setSubjectName('')
            }}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button onClick={handleAdd} disabled={isSubmitting}>
            {isSubmitting ? '追加中...' : '追加'}
          </Button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setCurrentSubject(null)
          setSubjectName('')
        }}
        title="教科を編集"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            教科名（{subjectName.length}/20文字）
          </label>
          <input
            type="text"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            maxLength={20}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003c68]"
            placeholder="教科名を入力"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditModal(false)
              setCurrentSubject(null)
              setSubjectName('')
            }}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button onClick={handleEdit} disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : '保存'}
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setCurrentSubject(null)
        }}
        title="教科を削除"
      >
        <p className="text-gray-700 mb-4">
          「{currentSubject?.subject_name}」を削除してもよろしいですか？
        </p>
        <p className="text-sm text-red-600 mb-4">
          この教科を使用している学習セッションがある場合、それらのセッションの教科が「指定なし」にリセットされます。
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeleteConfirm(false)
              setCurrentSubject(null)
            }}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isSubmitting}>
            {isSubmitting ? '削除中...' : '削除'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
