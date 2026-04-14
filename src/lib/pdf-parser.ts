import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, TextItem } from 'pdfjs-dist/types/src/display/api'
import type { Book, Chapter } from '../types/book'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface PageText {
  pageIndex: number
  items: { str: string; fontSize: number; hasEOL: boolean }[]
  fullText: string
}

// --- Entry point ---

export async function parsePDF(file: File): Promise<{ book: Book; chapters: Chapter[] }> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const [coverUrl, metadata, pageTexts] = await Promise.all([
    extractCover(pdf),
    pdf.getMetadata().catch(() => null),
    extractAllPageTexts(pdf),
  ])

  const title = metadata?.info && (metadata.info as Record<string, string>).Title
    ? (metadata.info as Record<string, string>).Title
    : file.name.replace(/\.pdf$/i, '')
  const author = metadata?.info && (metadata.info as Record<string, string>).Author
    ? (metadata.info as Record<string, string>).Author
    : '未知作者'

  const bookId = crypto.randomUUID()
  const chapters = await parseChapters(pdf, pageTexts, bookId)

  const book: Book = {
    id: bookId,
    title,
    author,
    coverUrl,
    addedAt: Date.now(),
    totalChapters: chapters.length,
  }

  return { book, chapters }
}

// --- Cover extraction ---

async function extractCover(pdf: PDFDocumentProxy): Promise<string | null> {
  try {
    const page = await pdf.getPage(1)
    const scale = 300 / page.getViewport({ scale: 1 }).width
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    await page.render({ canvas, canvasContext: ctx, viewport }).promise
    return canvas.toDataURL('image/jpeg', 0.8)
  } catch {
    return null
  }
}

// --- Text extraction ---

async function extractAllPageTexts(pdf: PDFDocumentProxy): Promise<PageText[]> {
  const pages: PageText[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const items = textContent.items
      .filter((item): item is TextItem => 'str' in item)
      .map((item) => ({
        str: item.str,
        fontSize: Math.abs(item.transform[0]),
        hasEOL: item.hasEOL ?? false,
      }))
    const fullText = items.map((it) => it.str + (it.hasEOL ? '\n' : '')).join('')
    pages.push({ pageIndex: i - 1, items, fullText })
  }
  return pages
}

// --- Chapter parsing (3-tier fallback) ---

async function parseChapters(
  pdf: PDFDocumentProxy,
  pageTexts: PageText[],
  bookId: string,
): Promise<Chapter[]> {
  // Strategy 1: outline
  const outline = await pdf.getOutline().catch(() => null)
  if (outline && outline.length >= 2) {
    const chapters = await splitByOutline(pdf, outline, pageTexts, bookId)
    if (chapters.length >= 2) return chapters
  }

  // Strategy 2: font style
  const chapters = splitByFontStyle(pageTexts, bookId)
  if (chapters.length >= 2) return chapters

  // Strategy 3: fixed pages
  return splitByFixedPages(pageTexts, 10, bookId)
}

// --- Strategy 1: Split by PDF outline ---

async function splitByOutline(
  pdf: PDFDocumentProxy,
  outline: Awaited<ReturnType<PDFDocumentProxy['getOutline']>>,
  pageTexts: PageText[],
  bookId: string,
): Promise<Chapter[]> {
  if (!outline) return []

  const entries: { title: string; pageIndex: number }[] = []

  for (const item of outline) {
    try {
      let dest = item.dest
      if (typeof dest === 'string') {
        dest = await pdf.getDestination(dest)
      }
      if (Array.isArray(dest)) {
        const pageIndex = await pdf.getPageIndex(dest[0])
        entries.push({ title: item.title, pageIndex })
      }
    } catch {
      // skip unresolvable dest
    }
  }

  if (entries.length < 2) return []
  entries.sort((a, b) => a.pageIndex - b.pageIndex)

  const chapters: Chapter[] = []
  for (let i = 0; i < entries.length; i++) {
    const start = entries[i].pageIndex
    const end = i + 1 < entries.length ? entries[i + 1].pageIndex : pageTexts.length
    const content = pageTexts
      .filter((p) => p.pageIndex >= start && p.pageIndex < end)
      .map((p) => p.fullText)
      .join('\n')
      .trim()
    chapters.push({
      id: `${bookId}-${i}`,
      bookId,
      index: i,
      title: entries[i].title,
      content,
    })
  }
  return chapters
}

// --- Strategy 2: Split by font style ---

function splitByFontStyle(pageTexts: PageText[], bookId: string): Chapter[] {
  // Build font size frequency map
  const sizeCount = new Map<number, number>()
  for (const page of pageTexts) {
    for (const item of page.items) {
      if (item.str.trim().length === 0) continue
      const size = Math.round(item.fontSize * 10) / 10
      sizeCount.set(size, (sizeCount.get(size) ?? 0) + item.str.length)
    }
  }

  // Find body font size (most frequent by character count)
  let bodySize = 12
  let maxCount = 0
  for (const [size, count] of sizeCount) {
    if (count > maxCount) {
      maxCount = count
      bodySize = size
    }
  }

  const threshold = bodySize * 1.2

  // Collect title candidates with page/position info
  interface TitleCandidate {
    text: string
    pageIndex: number
    itemIndex: number
  }
  const candidates: TitleCandidate[] = []

  for (const page of pageTexts) {
    let lineBuffer = ''
    let lineMaxSize = 0
    let lineStartIndex = 0

    for (let i = 0; i < page.items.length; i++) {
      const item = page.items[i]
      lineBuffer += item.str
      lineMaxSize = Math.max(lineMaxSize, item.fontSize)

      if (item.hasEOL || i === page.items.length - 1) {
        const trimmed = lineBuffer.trim()
        if (
          lineMaxSize >= threshold &&
          trimmed.length >= 2 &&
          trimmed.length <= 50
        ) {
          candidates.push({
            text: trimmed,
            pageIndex: page.pageIndex,
            itemIndex: lineStartIndex,
          })
        }
        lineBuffer = ''
        lineMaxSize = 0
        lineStartIndex = i + 1
      }
    }
  }

  if (candidates.length < 2) return []

  // Build chapters from candidates
  const chapters: Chapter[] = []
  for (let i = 0; i < candidates.length; i++) {
    const startPage = candidates[i].pageIndex
    const endPage = i + 1 < candidates.length ? candidates[i + 1].pageIndex : pageTexts.length
    const content = pageTexts
      .filter((p) => p.pageIndex >= startPage && p.pageIndex <= (endPage === pageTexts.length ? endPage - 1 : endPage))
      .map((p, idx) => {
        if (idx === 0 && i > 0) return p.fullText
        if (p.pageIndex === endPage && i + 1 < candidates.length) return ''
        return p.fullText
      })
      .join('\n')
      .trim()

    chapters.push({
      id: `${bookId}-${i}`,
      bookId,
      index: i,
      title: candidates[i].text,
      content,
    })
  }
  return chapters
}

// --- Strategy 3: Split by fixed page count ---

function splitByFixedPages(pageTexts: PageText[], pagesPerChapter: number, bookId: string): Chapter[] {
  const chapters: Chapter[] = []
  for (let i = 0; i < pageTexts.length; i += pagesPerChapter) {
    const slice = pageTexts.slice(i, i + pagesPerChapter)
    const chapterIndex = Math.floor(i / pagesPerChapter)
    chapters.push({
      id: `${bookId}-${chapterIndex}`,
      bookId,
      index: chapterIndex,
      title: `第 ${chapterIndex + 1} 章`,
      content: slice.map((p) => p.fullText).join('\n').trim(),
    })
  }
  return chapters
}
