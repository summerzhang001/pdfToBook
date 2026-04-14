import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Book, Chapter } from '../../types/book'
import { getAllBooks, getChaptersByBookId } from '../../lib/db'
import {
  getProgress, saveProgress,
  getSettings, saveSettings,
  throttle,
  type ReaderSettings,
} from '../../lib/reading-progress'
import Toolbar from './Toolbar'
import Sidebar from './Sidebar'
import Settings from './Settings'
import styles from './Reader.module.css'

const THEME_MAP: Record<ReaderSettings['theme'], { bg: string; text: string; toolbar: string }> = {
  white:  { bg: '#ffffff', text: '#333333', toolbar: 'rgba(255,255,255,0.95)' },
  yellow: { bg: '#f5e6c8', text: '#5b4636', toolbar: 'rgba(245,230,200,0.95)' },
  green:  { bg: '#c7edcc', text: '#2d4a2d', toolbar: 'rgba(199,237,204,0.95)' },
  dark:   { bg: '#1a1a1a', text: '#999999', toolbar: 'rgba(30,30,30,0.95)' },
}

export default function Reader() {
  const { bookId } = useParams<{ bookId: string }>()
  const navigate = useNavigate()

  const [book, setBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [toolbarVisible, setToolbarVisible] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [settings, setSettings] = useState<ReaderSettings>(getSettings)
  const [contentReady, setContentReady] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const pendingScroll = useRef<number | null>(null)

  // Load book and chapters
  useEffect(() => {
    if (!bookId) return
    Promise.all([getAllBooks(), getChaptersByBookId(bookId)]).then(([books, chs]) => {
      const b = books.find((x) => x.id === bookId)
      if (!b || chs.length === 0) {
        navigate('/', { replace: true })
        return
      }
      setBook(b)
      const sorted = chs.sort((a, c) => a.index - c.index)
      setChapters(sorted)

      const progress = getProgress(bookId)
      if (progress && progress.chapterIndex < sorted.length) {
        setCurrentIndex(progress.chapterIndex)
        pendingScroll.current = progress.scrollPosition
      }
    })
  }, [bookId, navigate])

  // Restore scroll position after content renders
  useEffect(() => {
    if (chapters.length === 0) return
    setContentReady(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (pendingScroll.current !== null && contentRef.current) {
          const target = contentRef.current.scrollHeight * pendingScroll.current
          window.scrollTo(0, contentRef.current.offsetTop + target)
          pendingScroll.current = null
        }
        setContentReady(true)
      })
    })
  }, [currentIndex, chapters])

  // Scroll progress tracking
  const getScrollPercent = useCallback(() => {
    const el = contentRef.current
    if (!el) return 0
    const scrollTop = window.scrollY - el.offsetTop
    const scrollHeight = el.scrollHeight - window.innerHeight
    if (scrollHeight <= 0) return 0
    return Math.min(1, Math.max(0, scrollTop / scrollHeight))
  }, [])

  const throttledSave = useMemo(
    () => throttle(() => {
      if (!bookId) return
      saveProgress(bookId, currentIndex, getScrollPercent())
    }, 300),
    [bookId, currentIndex, getScrollPercent],
  )

  useEffect(() => {
    if (!contentReady || !bookId) return
    window.addEventListener('scroll', throttledSave)
    return () => window.removeEventListener('scroll', throttledSave)
  }, [contentReady, bookId, throttledSave])

  // Save on page leave
  useEffect(() => {
    if (!bookId) return
    const save = () => saveProgress(bookId, currentIndex, getScrollPercent())
    window.addEventListener('beforeunload', save)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') save()
    })
    return () => {
      save()
      window.removeEventListener('beforeunload', save)
    }
  }, [bookId, currentIndex, getScrollPercent])

  /* Handlers */
  function goToChapter(index: number) {
    if (!bookId) return
    saveProgress(bookId, index, 0)
    setCurrentIndex(index)
    pendingScroll.current = null
    window.scrollTo(0, 0)
    setToolbarVisible(false)
    setSidebarVisible(false)
  }

  function handleContentClick(e: React.MouseEvent) {
    if (sidebarVisible || settingsVisible) return
    const y = e.clientY
    const third = window.innerHeight / 3
    if (y > third && y < third * 2) {
      setToolbarVisible((v) => !v)
    }
  }

  function handleSettingsChange(next: ReaderSettings) {
    setSettings(next)
    saveSettings(next)
  }

  // Theme CSS variables
  const theme = THEME_MAP[settings.theme]
  const themeStyle = {
    '--reader-bg': theme.bg,
    '--reader-text': theme.text,
    '--reader-toolbar-bg': theme.toolbar,
  } as React.CSSProperties

  const currentChapter = chapters[currentIndex]

  if (!book || !currentChapter) {
    return <div className={styles.loading}>加载中...</div>
  }

  return (
    <div className={styles.reader} style={themeStyle}>
      <Toolbar
        bookTitle={book.title}
        currentChapter={currentIndex}
        totalChapters={chapters.length}
        visible={toolbarVisible}
        onBack={() => navigate('/')}
        onToggleSidebar={() => { setSidebarVisible(true); setToolbarVisible(false) }}
        onToggleSettings={() => { setSettingsVisible(true); setToolbarVisible(false) }}
        onPrevChapter={() => goToChapter(currentIndex - 1)}
        onNextChapter={() => goToChapter(currentIndex + 1)}
      />

      <Sidebar
        chapters={chapters}
        currentIndex={currentIndex}
        visible={sidebarVisible}
        onSelect={goToChapter}
        onClose={() => setSidebarVisible(false)}
      />

      <Settings
        settings={settings}
        visible={settingsVisible}
        onChange={handleSettingsChange}
        onClose={() => setSettingsVisible(false)}
      />

      <div
        className={styles.content}
        ref={contentRef}
        onClick={handleContentClick}
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
        }}
      >
        <h2 className={styles.chapterTitle}>{currentChapter.title}</h2>
        {currentChapter.content.split('\n').map((para, i) =>
          para.trim() ? <p key={i} className={styles.paragraph}>{para}</p> : null,
        )}
        <div className={styles.chapterNav}>
          {currentIndex > 0 && (
            <button className={styles.chapterNavBtn} onClick={() => goToChapter(currentIndex - 1)}>
              ← 上一章
            </button>
          )}
          {currentIndex < chapters.length - 1 && (
            <button className={styles.chapterNavBtn} onClick={() => goToChapter(currentIndex + 1)}>
              下一章 →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
