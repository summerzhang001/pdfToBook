import type { Chapter } from '../../types/book'
import styles from './Sidebar.module.css'

interface SidebarProps {
  chapters: Chapter[]
  currentIndex: number
  visible: boolean
  onSelect: (index: number) => void
  onClose: () => void
}

export default function Sidebar({ chapters, currentIndex, visible, onSelect, onClose }: SidebarProps) {
  return (
    <>
      <div className={`${styles.overlay} ${visible ? styles.visible : ''}`} onClick={onClose} />
      <div className={`${styles.sidebar} ${visible ? styles.visible : ''}`}>
        <div className={styles.header}>
          <h3 className={styles.title}>目录</h3>
        </div>
        <ul className={styles.list}>
          {chapters.map((ch) => (
            <li
              key={ch.index}
              className={`${styles.item} ${ch.index === currentIndex ? styles.active : ''}`}
              onClick={() => onSelect(ch.index)}
            >
              {ch.title}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
