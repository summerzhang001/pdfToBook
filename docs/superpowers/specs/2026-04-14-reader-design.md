# 阅读器页面设计规格

## 概述

实现仿微信读书的沉浸式阅读器，滚动模式阅读，支持目录导航、字体/主题设置、阅读进度自动保存。PC/H5 响应式适配。

## 路由

- `/reader/:bookId` — 阅读器页面，通过 URL 参数获取书籍 ID

## 页面结构

### 阅读器主页面（Reader）

- 从 IndexedDB 加载书籍元数据和章节列表
- 默认显示第一章，或恢复上次阅读进度
- 滚动阅读，章节内容连续展示
- 章节末尾显示"上一章/下一章"切换按钮

### 沉浸式交互

- 默认全屏沉浸：隐藏顶部工具栏和底部导航栏
- 点击内容区域中间 1/3 → 切换工具栏显隐
- 工具栏出现时带半透明背景遮罩，点击遮罩关闭

### 顶部工具栏（Toolbar）

- 左侧：返回按钮（← 回到书架）
- 中间：当前书名
- 右侧：目录按钮、设置按钮
- 固定在顶部，带动画滑入滑出

### 底部导航栏

- 上一章 / 下一章按钮
- 中间显示 "第 X 章 / 共 Y 章"
- 固定在底部，跟随工具栏同步显隐

### 目录侧边栏（Sidebar）

- 点击工具栏"目录"按钮从左侧滑出
- 宽度：PC 300px，H5 80vw
- 列出所有章节标题，当前章节高亮蓝色
- 点击章节 → 切换到该章节并关闭侧边栏
- 右侧半透明遮罩，点击关闭

### 设置面板（Settings）

- 点击工具栏"设置"按钮从底部滑出
- 设置项：
  - 字体大小：滑块 14px ~ 28px，默认 18px
  - 行间距：三档按钮 1.6 / 1.8 / 2.0，默认 1.8
  - 背景主题：4 个圆形色块选择
- 设置实时生效，存入 localStorage
- 上方半透明遮罩，点击关闭

## 主题配色

| 名称 | 背景色   | 文字色   |
|------|----------|----------|
| 白色 | #ffffff  | #333333  |
| 浅黄 | #f5e6c8  | #5b4636  |
| 浅绿 | #c7edcc  | #2d4a2d  |
| 夜间 | #1a1a1a  | #999999  |

主题切换时 body 背景色同步变化，工具栏/侧边栏配色跟随主题。

## 阅读进度

### 存储结构（localStorage）

```ts
// key: `reading-progress-${bookId}`
interface ReadingProgress {
  bookId: string
  chapterIndex: number
  scrollPosition: number    // 章节内滚动百分比 0-1
  updatedAt: number
}
```

### 行为

- 滚动时节流（300ms）自动保存当前章节 index + 滚动百分比
- 切换章节时立即保存
- 打开书籍时读取进度，恢复到对应章节和滚动位置

### reading-progress.ts 接口

```ts
saveProgress(bookId: string, chapterIndex: number, scrollPosition: number): void
getProgress(bookId: string): ReadingProgress | null
```

## 用户设置

### 存储结构（localStorage）

```ts
// key: "reader-settings"
interface ReaderSettings {
  fontSize: number       // 14-28, default 18
  lineHeight: number     // 1.6 | 1.8 | 2.0, default 1.8
  theme: 'white' | 'yellow' | 'green' | 'dark'  // default 'white'
}
```

## 文件结构

```
src/
├── pages/
│   └── Reader/
│       ├── index.tsx              # 阅读器主页面
│       ├── Reader.module.css
│       ├── Toolbar.tsx            # 顶部工具栏 + 底部导航
│       ├── Toolbar.module.css
│       ├── Sidebar.tsx            # 目录侧边栏
│       ├── Sidebar.module.css
│       ├── Settings.tsx           # 设置面板
│       └── Settings.module.css
├── lib/
│   └── reading-progress.ts       # 进度和设置的 localStorage 读写
└── App.tsx                        # 新增 /reader/:bookId 路由
```

## 响应式适配

### PC（>768px）

- 阅读内容区 max-width 680px 居中
- 目录侧边栏宽度 300px
- 设置面板宽度 400px 居中

### H5（<=768px）

- 阅读内容区全宽，padding 20px
- 目录侧边栏宽度 80vw
- 设置面板全宽

## 本阶段不包含

- 书籍删除功能
- 搜索功能
- 书签/笔记功能
- 翻页模式
