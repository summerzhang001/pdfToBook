import styles from './Toolbar.module.css'

interface ToolbarProps {
  bookTitle: string
  currentChapter: number
  totalChapters: number
  visible: boolean
  onBack: () => void
  onToggleSidebar: () => void
  onToggleSettings: () => void
  onPrevChapter: () => void
  onNextChapter: () => void
}

export default function Toolbar({
  bookTitle,
  currentChapter,
  totalChapters,
  visible,
  onBack,
  onToggleSidebar,
  onToggleSettings,
  onPrevChapter,
  onNextChapter,
}: ToolbarProps) {
  return (
    <>
      <div className={`${styles.topBar} ${visible ? styles.visible : ''}`}>
        <button className={styles.backBtn} onClick={onBack} aria-label="返回书架">
          ← 返回
        </button>
        <span className={styles.title}>{bookTitle}</span>
        <div className={styles.actions}>
          <button onClick={onToggleSidebar} aria-label="目录">目录</button>
          <button onClick={onToggleSettings} aria-label="设置">设置</button>
        </div>
      </div>

      <div className={`${styles.bottomBar} ${visible ? styles.visible : ''}`}>
        <button
          className={styles.navBtn}
          disabled={currentChapter <= 0}
          onClick={onPrevChapter}
        >
          上一章
        </button>
        <span className={styles.progress}>
          第 {currentChapter + 1} 章 / 共 {totalChapters} 章
        </span>
        <button
          className={styles.navBtn}
          disabled={currentChapter >= totalChapters - 1}
          onClick={onNextChapter}
        >
          下一章
        </button>
      </div>
    </>
  )
}
