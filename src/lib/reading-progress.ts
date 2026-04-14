import type { ReadingProgress } from '../types/book'

const PROGRESS_PREFIX = 'reading-progress-'
const SETTINGS_KEY = 'reader-settings'

export interface ReaderSettings {
  fontSize: number
  lineHeight: number
  theme: 'white' | 'yellow' | 'green' | 'dark'
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.8,
  theme: 'white',
}

export function saveProgress(bookId: string, chapterIndex: number, scrollPosition: number): void {
  const progress: ReadingProgress = {
    bookId,
    chapterIndex,
    scrollPosition,
    updatedAt: Date.now(),
  }
  localStorage.setItem(PROGRESS_PREFIX + bookId, JSON.stringify(progress))
}

export function getProgress(bookId: string): ReadingProgress | null {
  const raw = localStorage.getItem(PROGRESS_PREFIX + bookId)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ReadingProgress
  } catch {
    return null
  }
}

export function saveSettings(settings: ReaderSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function getSettings(): ReaderSettings {
  const raw = localStorage.getItem(SETTINGS_KEY)
  if (!raw) return DEFAULT_SETTINGS
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function throttle<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let timer: number | null = null
  return ((...args: never[]) => {
    if (timer) return
    timer = window.setTimeout(() => { timer = null }, ms)
    fn(...args)
  }) as T
}
