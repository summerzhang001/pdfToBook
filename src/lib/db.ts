import { openDB, type IDBPDatabase } from 'idb'
import type { Book, Chapter } from '../types/book'

const DB_NAME = 'pdfToBook'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('chapters')) {
          const store = db.createObjectStore('chapters', { keyPath: 'id' })
          store.createIndex('bookId', 'bookId', { unique: false })
        }
      },
    })
  }
  return dbPromise
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDB()
  return db.getAll('books')
}

export async function addBook(book: Book): Promise<void> {
  const db = await getDB()
  await db.put('books', book)
}

export async function deleteBook(bookId: string): Promise<void> {
  const db = await getDB()
  await db.delete('books', bookId)
  await deleteChaptersByBookId(bookId)
}

export async function addChapters(chapters: Chapter[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('chapters', 'readwrite')
  for (const chapter of chapters) {
    await tx.store.put(chapter)
  }
  await tx.done
}

export async function getChaptersByBookId(bookId: string): Promise<Chapter[]> {
  const db = await getDB()
  return db.getAllFromIndex('chapters', 'bookId', bookId)
}

export async function deleteChaptersByBookId(bookId: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('chapters', 'readwrite')
  const index = tx.store.index('bookId')
  let cursor = await index.openCursor(bookId)
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }
  await tx.done
}
