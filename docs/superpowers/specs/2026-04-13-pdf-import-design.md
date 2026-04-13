# PDF 导入与解析模块设计规格

## 概述

实现 PDF 文件导入、解析、章节识别、封面提取，将结构化数据存入 IndexedDB，并集成到书架列表。纯前端方案，无服务端依赖。

## 核心依赖

- `pdfjs-dist` — PDF 解析引擎
- `idb` — IndexedDB 轻量封装

## 数据结构

### Book（存 IndexedDB `books` store）

```ts
interface Book {
  id: string                  // crypto.randomUUID()
  title: string               // 优先取 PDF metadata，降级为文件名
  author: string              // 优先取 PDF metadata，降级为 "未知作者"
  coverUrl: string | null     // base64 data URL，PDF第一页 canvas 截图
  addedAt: number             // 导入时间戳
  totalChapters: number       // 章节总数
}
```

### Chapter（存 IndexedDB `chapters` store）

```ts
interface Chapter {
  id: string                  // `${bookId}-${index}`
  bookId: string              // 关联 Book.id
  index: number               // 章节序号，从 0 开始
  title: string               // 章节标题
  content: string             // 章节纯文本内容
}
```

### ReadingProgress（存 localStorage）

```ts
interface ReadingProgress {
  bookId: string
  chapterIndex: number
  scrollPosition: number      // 章节内滚动百分比 0-1
  updatedAt: number
}
```

## PDF 解析流程

```
用户点击"导入PDF" → 文件选择器 (accept=".pdf")
       ↓
  pdfjs-dist 加载 PDF ArrayBuffer
       ↓
  并行执行：
    1. 提取第一页渲染为封面 (canvas → toDataURL)
    2. 读取 PDF outline（书签大纲）
    3. 逐页提取文本内容（getTextContent）
       ↓
  章节识别（三层降级）：
    ① 有 outline → 按书签 dest 对应的页码分章
    ② 无 outline → 按字体大小/加粗等样式特征识别标题行，以标题行分章
    ③ 都失败 → 按固定页数分割（每 10 页一章）
       ↓
  组装 Book + Chapter[] → 写入 IndexedDB
       ↓
  书架列表刷新，显示新书
```

## 章节识别策略细节

### 策略一：Outline 书签

- 调用 `pdf.getOutline()` 获取书签树
- 通过 `getDestination()` + `getPageIndex()` 将每个书签映射到页码
- 按页码范围切割已提取的文本

### 策略二：字体样式识别

- 遍历每页 `getTextContent()` 返回的 items
- 每个 item 包含 `str`（文本）、`transform`（含字体大小）、`fontName`
- 统计全文最常见字体大小作为正文基准
- 字体大小显著大于基准（>1.2倍）的独立行视为标题候选
- 过滤掉过短（<2字符）或过长（>50字符）的候选
- 以标题行为分割点切分章节

### 策略三：固定分页兜底

- 每 10 页合并为一章
- 章节标题为 "第 N 章"

## 封面提取

- 获取 PDF 第一页
- 创建 canvas，viewport 缩放到宽度 300px
- `page.render()` 渲染到 canvas
- `canvas.toDataURL('image/jpeg', 0.8)` 生成 base64
- 存入 Book.coverUrl

## IndexedDB 设计

- 数据库名：`pdfToBook`，版本：1
- Store `books`：主键 `id`
- Store `chapters`：主键 `id`，索引 `bookId`（用于按书查询章节）

### db.ts 导出接口

```ts
getAllBooks(): Promise<Book[]>
addBook(book: Book): Promise<void>
deleteBook(bookId: string): Promise<void>
getChaptersByBookId(bookId: string): Promise<Chapter[]>
addChapters(chapters: Chapter[]): Promise<void>
deleteChaptersByBookId(bookId: string): Promise<void>
```

## 文件结构

```
src/
├── lib/
│   ├── pdf-parser.ts          # PDF 解析：文本提取、章节识别、封面生成
│   └── db.ts                  # IndexedDB CRUD 封装
├── types/
│   └── book.ts                # Book、Chapter、ReadingProgress 类型（扩展现有）
└── pages/
    └── Home/
        └── index.tsx           # 接入导入逻辑，从 IndexedDB 加载书架
```

## 导入交互

- 点击"导入 PDF 文件"按钮 → 触发隐藏 `<input type="file" accept=".pdf">`
- 选择文件后按钮变为"解析中..."并禁用
- 解析成功 → 新书出现在书架，按钮恢复
- 解析失败 → 显示错误提示（简单的 toast 或内联提示），按钮恢复

## Home 页改造

- 移除 mock 数据，改为 `useEffect` 从 IndexedDB 加载书籍列表
- 导入成功后刷新列表
- 书架为空时显示空状态引导

## 本阶段不包含

- 阅读器页面
- 阅读进度保存（类型已定义，实现留到阅读器阶段）
- 书籍删除功能（db 接口已预留，UI 留到后续）
