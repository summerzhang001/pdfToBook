import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Book } from '../../types/book'
import { getAllBooks, addBook, addChapters } from '../../lib/db'
import { parsePDF } from '../../lib/pdf-parser'
import BookCard from '../../components/BookCard'
import styles from './Home.module.css'

export default function Home() {
  const [books, setBooks] = useState<Book[]>([])
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    getAllBooks().then((list) => {
      setBooks(list.sort((a, b) => b.addedAt - a.addedAt))
    })
  }, [])

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setError(null)

    try {
      const { book, chapters } = await parsePDF(file)
      await addBook(book)
      await addChapters(chapters)
      setBooks((prev) => [book, ...prev])
    } catch (err) {
      console.error('PDF parse error:', err)
      setError('PDF 解析失败，请检查文件是否有效')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleBookClick(book: Book) {
    navigate(`/reader/${book.id}`)
  }

  return (
    <div className={styles.container}>
      <div className={styles.importSection}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          hidden
          onChange={handleImport}
        />
        <button
          className={styles.importBtn}
          disabled={importing}
          onClick={() => fileInputRef.current?.click()}
        >
          <span className={styles.importIcon}>{importing ? '' : '+'}</span>
          {importing ? '解析中...' : '导入 PDF 文件'}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.shelf}>
        <h2 className={styles.shelfTitle}>我的书架</h2>
        {books.length === 0 ? (
          <p className={styles.empty}>还没有书籍，点击上方按钮导入 PDF</p>
        ) : (
          <div className={styles.grid}>
            {books.map((book) => (
              <BookCard key={book.id} book={book} onClick={handleBookClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
