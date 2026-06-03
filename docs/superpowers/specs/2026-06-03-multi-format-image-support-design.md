# 多格式图片支持设计文档

## 概述

扩展 SVG Icon Manager 以支持多种图片格式，包括 svg、png、jpg、jpeg、webp、gif、ico、bmp。新增格式筛选功能，并优化大项目性能。

## 需求摘要

1. 支持扫描和预览多种图片格式
2. 顶部新增多选格式筛选器，默认选中 svg
3. 图片卡片支持点击预览大图
4. 大项目性能优化（虚拟滚动、懒加载）

## 数据模型

### 类型定义

```typescript
// 支持的图片格式
export type ImageFormat = 'svg' | 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif' | 'ico' | 'bmp';

// 将 SvgIcon 重命名为 ImageAsset
export interface ImageAsset {
  name: string;           // 文件名（不含扩展名）
  path: string;           // 绝对路径
  relativePath: string;   // 相对工作区的路径
  format: ImageFormat;    // 文件格式
  size: { width: number; height: number };
  content?: string;       // SVG 内联内容（仅 SVG 有）
}
```

### 设计要点

- SVG 保留 `content` 字段用于内联渲染
- 图片格式不存储内容，通过 file URI 按需加载
- `format` 字段用于筛选和区分渲染方式

## 扫描器改造

### Scanner 修改

```typescript
export class IconScanner {
  // 支持的格式列表
  private static readonly SUPPORTED_FORMATS = [
    'svg', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'ico', 'bmp'
  ] as const;

  async scan(formats?: ImageFormat[]): Promise<ImageAsset[]> {
    const files = await this.findImageFiles(this.workspaceRoot, formats);

    // 使用 allSettled 确保部分失败不影响整体
    const results = await Promise.allSettled(
      files.map(filePath => this.parseImageFile(filePath))
    );

    // 只取成功的解析结果
    const assets = results
      .filter((r): r is PromiseFulfilledResult<ImageAsset | null> =>
        r.status === 'fulfilled')
      .map(r => r.value)
      .filter((asset): asset is ImageAsset => asset !== null);

    return assets.sort((a, b) => a.name.localeCompare(b.name));
  }
}
```

### 性能考虑

1. **Promise.allSettled** - 单个文件解析失败不影响整体扫描
2. **格式预筛选** - 只扫描用户选中的格式
3. **并行处理** - 多文件并行解析

### 图片尺寸获取

- 使用文件头信息提取尺寸（不读取整个文件）
- 可选方案：`image-size` 库或自定义解析器

## UI 设计

### 顶部筛选栏

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🖼️ Image Assets                    [🔍 搜索框] [目录下拉] [🔄 刷新]  │
├─────────────────────────────────────────────────────────────────────┤
│ 格式筛选: [svg ✓] [png ✓] [jpg ✓] [webp □] [gif □] [ico □] [bmp □] │
└─────────────────────────────────────────────────────────────────────┘
```

### 格式筛选器

- 类型：多选 `<select multiple>`
- 默认：选中 `svg`
- 交互：Ctrl+点击 或 Shift+点击 多选
- 特殊：选中 0 个 = 显示全部格式

### 卡片渲染差异

| 格式 | 预览渲染 | 点击行为 |
|------|----------|----------|
| SVG | 内联 `<svg>` 标签 | 无特殊行为 |
| 图片 | `<img src="file-uri">` + 放大图标遮罩 | 弹出大图预览 modal |

### 大图预览 Modal

```html
<div class="preview-modal" id="previewModal">
  <div class="modal-backdrop"></div>
  <div class="modal-content">
    <button class="modal-close">✕</button>
    <img class="preview-image" src="file-uri" />
    <div class="modal-info">
      <span class="file-name">logo.png</span>
      <span class="file-size">1920 × 1080</span>
    </div>
  </div>
</div>
```

#### 交互方式

| 操作 | 效果 |
|------|------|
| 点击图片卡片预览区 | 打开 modal，显示大图 |
| 点击遮罩层 / 关闭按钮 | 关闭 modal |
| 按 `Esc` 键 | 关闭 modal |

## 性能优化

### 1. 虚拟滚动（Virtual Scroll）

对于超过 100 个资源时启用：

```javascript
// 只渲染可视区域 + 缓冲区的卡片
const visibleStart = Math.floor(scrollTop / cardHeight) - buffer;
const visibleEnd = visibleStart + visibleCount + buffer;
const visibleCards = allCards.slice(visibleStart, visibleEnd);
```

### 2. 图片懒加载

```html
<img loading="lazy" src="file-uri" />
```

浏览器原生支持，滚动到可视区域才加载图片。

### 3. 扫描进度提示

```typescript
// 扫描过程中发送进度消息
postMessage({
  command: 'scanProgress',
  current: processed,
  total: totalFiles
});
```

## 文件改动清单

| 文件 | 改动内容 |
|------|----------|
| `src/types.ts` | 重命名 `SvgIcon` → `ImageAsset`，新增 `ImageFormat` 类型 |
| `src/scanner.ts` | 支持多格式扫描，使用 `Promise.allSettled` |
| `src/webview/index.ts` | 新增格式筛选状态，处理格式筛选消息 |
| `src/webview/templates.ts` | 新增格式筛选器 HTML，图片卡片渲染，预览 Modal |
| `src/webview/scripts.ts` | 格式筛选交互，Modal 打开/关闭，虚拟滚动 |
| `src/webview/styles.ts` | 格式筛选器样式，Modal 样式，图片卡片遮罩样式 |
| `package.json` | 更新扩展描述（支持多格式） |

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 大量图片内存占用 | 使用 file URI 而非 base64 |
| 虚拟滚动实现复杂度 | 先实现基础功能，虚拟滚动作为可选优化 |
| 图片尺寸解析失败 | 提供默认尺寸，不影响显示 |
