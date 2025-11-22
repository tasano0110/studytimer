import { create } from 'zustand'
import type { Subject } from '@/types'

interface TimerState {
  isRunning: boolean
  currentSessionId: string | null
  selectedSubject: Subject
  startTime: Date | null
  setIsRunning: (running: boolean) => void
  setCurrentSessionId: (id: string | null) => void
  setSelectedSubject: (subject: Subject) => void
  setStartTime: (time: Date | null) => void
  reset: () => void
}

export const useTimerStore = create<TimerState>((set) => ({
  isRunning: false,
  currentSessionId: null,
  selectedSubject: '指定なし',
  startTime: null,
  setIsRunning: (running) => set({ isRunning: running }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
  setSelectedSubject: (subject) => set({ selectedSubject: subject }),
  setStartTime: (time) => set({ startTime: time }),
  reset: () =>
    set({
      isRunning: false,
      currentSessionId: null,
      selectedSubject: '指定なし',
      startTime: null,
    }),
}))
