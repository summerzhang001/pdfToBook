import type { Book } from '../../types/book'
import styles from './BookCard.module.css'

const COVER_COLORS = [
  '#B5D6F5', '#F5D5B5', '#D5F5B5', '#F5B5D5',
  '#B5F5E0', '#E0B5F5', '#F5F0B5', '#B5C8F5',
]

function getColorForId(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length]
}

interface BookCardProps {
  book: Book
  onClick: (book: Book) => void
}

export default function BookCard({ book, onClick }: BookCardProps) {
  return (
    <div className={styles.card} onClick={() => onClick(book)}>
      <div className={styles.cover}>
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className={styles.coverImg} />
        ) : (
          <div
            className={styles.placeholder}
            style={{ backgroundColor: getColorForId(book.id) }}
          >
            <span className={styles.placeholderText}>{book.title}</span>
          </div>
        )}
      </div>
      <p className={styles.title}>{book.title}</p>
      <p className={styles.author}>{book.author}</p>
    </div>
  )
}
