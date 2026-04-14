import type { ReaderSettings } from '../../lib/reading-progress'
import styles from './Settings.module.css'

const THEMES: { key: ReaderSettings['theme']; label: string; bg: string }[] = [
  { key: 'white', label: '白', bg: '#ffffff' },
  { key: 'yellow', label: '黄', bg: '#f5e6c8' },
  { key: 'green', label: '绿', bg: '#c7edcc' },
  { key: 'dark', label: '夜', bg: '#1a1a1a' },
]

const LINE_HEIGHTS = [1.6, 1.8, 2.0]

interface SettingsProps {
  settings: ReaderSettings
  visible: boolean
  onChange: (settings: ReaderSettings) => void
  onClose: () => void
}

export default function Settings({ settings, visible, onChange, onClose }: SettingsProps) {
  return (
    <>
      <div className={`${styles.overlay} ${visible ? styles.visible : ''}`} onClick={onClose} />
      <div className={`${styles.panel} ${visible ? styles.visible : ''}`}>
        <div className={styles.row}>
          <span className={styles.label}>字体大小</span>
          <div className={styles.sliderWrap}>
            <span className={styles.sliderLabel}>A</span>
            <input
              type="range"
              min={14}
              max={28}
              step={1}
              value={settings.fontSize}
              className={styles.slider}
              onChange={(e) => onChange({ ...settings, fontSize: Number(e.target.value) })}
            />
            <span className={styles.sliderLabelLg}>A</span>
            <span className={styles.sizeValue}>{settings.fontSize}</span>
          </div>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>行间距</span>
          <div className={styles.btnGroup}>
            {LINE_HEIGHTS.map((lh) => (
              <button
                key={lh}
                className={`${styles.btn} ${settings.lineHeight === lh ? styles.btnActive : ''}`}
                onClick={() => onChange({ ...settings, lineHeight: lh })}
              >
                {lh}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>背景主题</span>
          <div className={styles.themes}>
            {THEMES.map((t) => (
              <button
                key={t.key}
                className={`${styles.themeBtn} ${settings.theme === t.key ? styles.themeBtnActive : ''}`}
                style={{ backgroundColor: t.bg }}
                onClick={() => onChange({ ...settings, theme: t.key })}
                aria-label={t.label}
              >
                {settings.theme === t.key && '✓'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
