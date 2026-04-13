# 首页设计规格：基础框架 + 书架首页

## 概述

实现 pdfToBook 的基础框架搭建和首页静态页面。首页参考微信读书风格，包含导入 PDF 按钮和书架列表展示。本阶段使用 mock 数据，后续再接入真实 PDF 导入。

## 技术选型

- **路由**: react-router-dom（`/` 书架页，`/reader/:bookId` 阅读页预留）
- **样式**: CSS Modules，不引入 UI 框架
- **风格**: 参考微信读书的简洁白色风格

## 文件结构

```
src/
├── main.tsx                    # 入口，挂载路由
├── App.tsx                     # 路由配置
├── styles/
│   └── global.css              # 全局样式、CSS变量、响应式基础
├── pages/
│   └── Home/
│       ├── index.tsx            # 首页组件
│       └── Home.module.css      # 首页样式
├── components/
│   ├── BookCard/
│   │   ├── index.tsx            # 书籍卡片组件
│   │   └── BookCard.module.css
│   └── Header/
│       ├── index.tsx            # 顶部标题栏
│       └── Header.module.css
└── types/
    └── book.ts                 # Book 类型定义
```

## 数据类型

```ts
interface Book {
  id: string
  title: string
  author: string
  coverUrl: string | null  // PDF第一页截图URL，null时降级为文字封面
  addedAt: number          // 导入时间戳
}
```

## 首页布局

### 顶部标题栏
- 居中显示应用名称 "PDF To Book"
- 简洁白底，底部细线分割

### 导入区域
- 居中放置 "导入 PDF 文件" 按钮
- 按钮样式：蓝色主色调圆角按钮，带 + 图标
- 点击触发文件选择器（本阶段仅 UI，不实现导入逻辑）

### 书架区域
- 标题 "我的书架" 左对齐
- 书籍卡片网格布局：
  - PC端（>768px）：一行 4 本，max-width 960px 居中
  - H5端（<=768px）：一行 3 本，左右 padding 16px
- 空状态：书架为空时显示引导文案 "还没有书籍，点击上方按钮导入 PDF"

### 书籍卡片（BookCard）
- 封面区域：3:4 比例，圆角 8px，轻微阴影
  - 有 coverUrl 时显示封面图
  - 无 coverUrl 时显示文字封面（随机浅色背景 + 书名文字）
- 封面下方显示书名（单行截断）和作者（单行截断、灰色小字）
- hover 效果：卡片微上浮 + 阴影加深

## 样式规范

### CSS 变量
```css
--color-primary: #1e80ff       /* 主色调蓝 */
--color-bg: #f7f8fa            /* 页面背景 */
--color-card-bg: #ffffff       /* 卡片背景 */
--color-text: #333333          /* 主文字 */
--color-text-secondary: #999   /* 次要文字 */
--color-border: #e8e8e8        /* 分割线 */
--radius-card: 8px             /* 卡片圆角 */
--shadow-card: 0 2px 8px rgba(0,0,0,0.08)  /* 卡片阴影 */
```

### 响应式断点
- `>768px`：PC 布局，内容区 max-width 960px 居中
- `<=768px`：H5 布局，全宽，padding 16px

## Mock 数据

首页使用 4-6 本 mock 书籍展示效果，部分有 coverUrl（null），部分无，以验证两种封面展示模式。

## 本阶段不包含

- PDF 文件实际导入和解析
- IndexedDB 数据持久化
- 阅读器页面
- 书籍删除功能
