export interface Book {
  id: string
  title: string
  author: string
  coverUrl: string | null
  addedAt: number
  totalChapters: number
}

export interface Chapter {
  id: string
  bookId: string
  index: number
  title: string
  content: string
}

export interface ReadingProgress {
  bookId: string
  chapterIndex: number
  scrollPosition: number
  updatedAt: number
}
