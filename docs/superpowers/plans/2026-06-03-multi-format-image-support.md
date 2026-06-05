# 多格式图片支持实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 扩展 SVG Icon Manager 支持多种图片格式（svg、png、jpg、jpeg、webp、gif、ico、bmp），新增格式筛选功能，支持图片大图预览。

**Architecture:** 在现有架构基础上扩展，将 SvgIcon 重命名为 ImageAsset，Scanner 支持多格式扫描，Webview 增加格式筛选和图片预览 Modal。

**Tech Stack:** TypeScript, VS Code Extension API, HTML/CSS/JS (Webview)

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `src/types.ts` | 类型定义：ImageFormat, ImageAsset, WebviewMessage |
| `src/scanner.ts` | 文件扫描：多格式支持，Promise.allSettled |
| `src/webview/index.ts` | Panel 控制器：格式筛选状态，消息处理 |
| `src/webview/templates.ts` | HTML 模板：格式筛选器，图片卡片，预览 Modal |
| `src/webview/scripts.ts` | 客户端 JS：筛选交互，Modal，懒加载 |
| `src/webview/styles.ts` | CSS 样式：筛选器，Modal，图片遮罩 |
| `package.json` | 扩展元信息更新 |

---

## Task 1: 更新类型定义

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: 重命名 SvgIcon 为 ImageAsset，新增 ImageFormat 类型**

```typescript
/**
 * 支持的图片格式
 */
export type ImageFormat = 'svg' | 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif' | 'ico' | 'bmp';

/**
 * 图片资源类型定义
 */
export interface ImageAsset {
  name: string;           // 文件名（不含扩展名）
  path: string;           // 绝对路径
  relativePath: string;   // 相对工作区的路径
  format: ImageFormat;    // 文件格式
  size: { width: number; height: number };
  content?: string;       // SVG 内联内容（仅 SVG 有）
}

/**
 * Webview message types
 */
export type WebviewCommand =
  | "search"
  | "filterByPath"
  | "filterByFormat"
  | "copyName"
  | "copyImport"
  | "openFile"
  | "refresh"
  | "updateIcons"
  | "previewImage";

export interface WebviewMessage {
  command: WebviewCommand;
  query?: string;
  path?: string;
  name?: string;
  formats?: ImageFormat[];
}

export interface UpdateIconsMessage {
  command: "updateIcons";
  icons: string;
  count: number;
  total: number;
}

/**
 * Configuration interface
 */
export interface SvgIconManagerConfig {
  ignorePatterns: string[];
  iconSize: number;
}
```

- [ ] **Step 2: 验证编译通过**

Run: `cd d:/my-project/svg-icon-manager && npm run compile`
Expected: 编译成功（可能有其他文件的类型错误，后续修复）

- [ ] **Step 3: 提交**

```bash
git add src/types.ts
git commit -m "refactor: rename SvgIcon to ImageAsset, add ImageFormat type"
```

---

## Task 2: 更新 Scanner 支持多格式

**Files:**
- Modify: `src/scanner.ts`

- [ ] **Step 1: 更新 Scanner 支持多格式扫描**

```typescript
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ImageAsset, ImageFormat } from "./types";

/**
 * 支持的图片格式列表
 */
const SUPPORTED_FORMATS: ImageFormat[] = [
  'svg', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'ico', 'bmp'
];

/**
 * 格式对应的文件扩展名映射
 */
const FORMAT_EXTENSIONS: Record<ImageFormat, string[]> = {
  svg: ['.svg'],
  png: ['.png'],
  jpg: ['.jpg', '.jpeg'],
  jpeg: ['.jpg', '.jpeg'],
  webp: ['.webp'],
  gif: ['.gif'],
  ico: ['.ico'],
  bmp: ['.bmp']
};

/**
 * IconScanner - Scans workspace for image assets
 */
export class IconScanner {
  private assets: ImageAsset[] = [];
  private ignorePatterns: string[] = [];

  constructor(private workspaceRoot: string | undefined) {
    this.loadConfig();
  }

  private loadConfig(): void {
    const config = vscode.workspace.getConfiguration("svgIconManager");
    this.ignorePatterns = config.get<string[]>("ignorePatterns", [
      "node_modules",
      ".git",
      "out",
      "dist",
      "build",
      "coverage",
    ]);
  }

  /**
   * 扫描指定格式的图片资源
   * @param formats 要扫描的格式列表，undefined 表示扫描全部
   */
  async scan(formats?: ImageFormat[]): Promise<ImageAsset[]> {
    this.assets = [];
    this.loadConfig();

    if (!this.workspaceRoot) {
      return this.assets;
    }

    const targetFormats = formats || SUPPORTED_FORMATS;
    const files = await this.findImageFiles(this.workspaceRoot, targetFormats);

    // 使用 Promise.allSettled 确保部分失败不影响整体
    const results = await Promise.allSettled(
      files.map(filePath => this.parseImageFile(filePath))
    );

    // 只取成功的解析结果
    this.assets = results
      .filter((r): r is PromiseFulfilledResult<ImageAsset | null> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter((asset): asset is ImageAsset => asset !== null);

    this.assets.sort((a, b) => a.name.localeCompare(b.name));
    return this.assets;
  }

  /**
   * 获取所有支持的格式列表
   */
  static getSupportedFormats(): ImageFormat[] {
    return [...SUPPORTED_FORMATS];
  }

  private async findImageFiles(
    dir: string,
    formats: ImageFormat[],
    depth: number = 0,
    maxDepth: number = 10,
  ): Promise<string[]> {
    const files: string[] = [];

    if (depth > maxDepth) {
      return files;
    }

    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (this.ignorePatterns.includes(entry.name)) {
          continue;
        }

        if (entry.isDirectory()) {
          const subFiles = await this.findImageFiles(
            fullPath,
            formats,
            depth + 1,
            maxDepth,
          );
          files.push(...subFiles);
        } else {
          // 检查文件扩展名是否匹配目标格式
          const ext = path.extname(entry.name).toLowerCase();
          const isMatch = formats.some(format =>
            FORMAT_EXTENSIONS[format].includes(ext)
          );
          if (isMatch) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }

    return files;
  }

  private async parseImageFile(filePath: string): Promise<ImageAsset | null> {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const format = this.getFormatFromExtension(ext);

      if (!format) {
        return null;
      }

      const relativePath = path.relative(this.workspaceRoot!, filePath);
      const name = path.basename(filePath, ext);

      // SVG 特殊处理：读取内容用于内联渲染
      if (format === 'svg') {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const size = this.extractSvgSize(content);

        return {
          name,
          path: filePath,
          relativePath: relativePath.replace(/\\/g, "/"),
          format,
          size,
          content,
        };
      }

      // 其他图片格式：只获取尺寸，不读取内容
      const size = await this.getImageSize(filePath);

      return {
        name,
        path: filePath,
        relativePath: relativePath.replace(/\\/g, "/"),
        format,
        size,
      };
    } catch (error) {
      console.error(`Error parsing image file ${filePath}:`, error);
      return null;
    }
  }

  private getFormatFromExtension(ext: string): ImageFormat | null {
    for (const [format, extensions] of Object.entries(FORMAT_EXTENSIONS)) {
      if (extensions.includes(ext)) {
        return format as ImageFormat;
      }
    }
    return null;
  }

  private extractSvgSize(content: string): { width: number; height: number } {
    const widthMatch = content.match(/width=["'](\d+(?:\.\d+)?)(?:px|)?["']/i);
    const heightMatch = content.match(
      /height=["'](\d+(?:\.\d+)?)(?:px|)?["']/i,
    );
    const viewBoxMatch = content.match(
      /viewBox=["'](\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)["']/i,
    );

    let width = 0;
    let height = 0;

    if (widthMatch && heightMatch) {
      width = parseFloat(widthMatch[1]);
      height = parseFloat(heightMatch[1]);
    } else if (viewBoxMatch) {
      width = parseFloat(viewBoxMatch[3]);
      height = parseFloat(viewBoxMatch[4]);
    }

    return { width, height };
  }

  /**
   * 获取图片尺寸（通过读取文件头）
   * 简化实现：返回默认尺寸，实际可使用 image-size 库
   */
  private async getImageSize(filePath: string): Promise<{ width: number; height: number }> {
    // TODO: 可集成 image-size 库获取实际尺寸
    // 当前返回默认尺寸
    return { width: 0, height: 0 };
  }
}
```

- [ ] **Step 2: 验证编译通过**

Run: `cd d:/my-project/svg-icon-manager && npm run compile`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add src/scanner.ts
git commit -m "feat(scanner): add multi-format image scanning support"
```

---

## Task 3: 更新 Webview Panel 控制器

**Files:**
- Modify: `src/webview/index.ts`

- [ ] **Step 1: 添加格式筛选状态和消息处理**

```typescript
import * as vscode from "vscode";
import * as path from "path";
import { ImageAsset, ImageFormat, WebviewMessage } from "../types";
import { IconScanner } from "../scanner";
import { getStyles } from "./styles";
import { getScripts } from "./scripts";
import {
  renderIconCards,
  renderDirectoryOptions,
  renderFormatOptions,
  renderStats,
  getWebviewHtml,
} from "./templates";

/**
 * IconPanel - Manages the webview panel for displaying image assets
 */
export class IconPanel {
  private panel: vscode.WebviewPanel | undefined;
  private assets: ImageAsset[] = [];
  private filteredAssets: ImageAsset[] = [];
  private directories: string[] = [];
  private selectedDirectory: string = "";
  private searchQuery: string = "";
  private selectedFormats: ImageFormat[] = ["svg"]; // 默认选中 svg
  private iconSize: number = 80;

  constructor(
    private context: vscode.ExtensionContext,
    private workspaceRoot: string | undefined,
    private scanner: IconScanner,
  ) {
    this.loadConfig();
  }

  private loadConfig(): void {
    const config = vscode.workspace.getConfiguration("svgIconManager");
    this.iconSize = config.get<number>("iconSize", 80);
  }

  async show(): Promise<void> {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "svgIconManager",
      "SVG Icon Manager",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: this.workspaceRoot
          ? [vscode.Uri.file(this.workspaceRoot)]
          : [],
      },
    );

    this.registerMessageHandler();
    this.registerDisposeHandler();
    await this.refresh();
  }

  private registerMessageHandler(): void {
    if (!this.panel) {
      return;
    }

    this.panel.webview.onDidReceiveMessage(
      async (message: WebviewMessage) => {
        console.log("🚀 ~ IconPanel ~ message:", message);
        switch (message.command) {
          case "search":
            this.searchQuery = message.query || "";
            this.applyFilters();
            break;
          case "filterByPath":
            this.selectedDirectory = message.path || "";
            this.applyFilters();
            break;
          case "filterByFormat":
            this.selectedFormats = message.formats || [];
            // 格式变化需要重新扫描
            await this.refresh();
            break;
          case "copyName":
            if (message.name) {
              await this.copyName(message.name);
            }
            break;
          case "copyImport":
            if (message.path && message.name) {
              await this.copyImport(message.path, message.name);
            }
            break;
          case "openFile":
            if (message.path) {
              await this.openFile(message.path);
            }
            break;
          case "refresh":
            await this.refresh();
            break;
        }
      },
      undefined,
      this.context.subscriptions,
    );
  }

  private registerDisposeHandler(): void {
    if (!this.panel) {
      return;
    }

    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
      },
      null,
      this.context.subscriptions,
    );
  }

  async refresh(): Promise<void> {
    this.loadConfig();
    // 根据选中的格式扫描，如果未选中任何格式则扫描全部
    const formatsToScan = this.selectedFormats.length > 0 ? this.selectedFormats : undefined;
    this.assets = await this.scanner.scan(formatsToScan);
    this.directories = this.extractDirectories(this.assets);
    this.applyFilters();
    this.updateFull();
  }

  private extractDirectories(assets: ImageAsset[]): string[] {
    const dirSet = new Set<string>();
    assets.forEach((asset) => {
      const dir = path.dirname(asset.relativePath);
      if (dir !== ".") {
        dirSet.add(dir);
      }
    });
    return Array.from(dirSet).sort();
  }

  private applyFilters(): void {
    let result = [...this.assets];

    // Apply directory filter
    if (this.selectedDirectory) {
      result = result.filter((asset) => {
        const dir = path.dirname(asset.relativePath);
        return dir === this.selectedDirectory;
      });
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const lowerQuery = this.searchQuery.toLowerCase();
      result = result.filter(
        (asset) =>
          asset.name.toLowerCase().includes(lowerQuery) ||
          asset.relativePath.toLowerCase().includes(lowerQuery),
      );
    }

    this.filteredAssets = result;
    this.updateIcons();
  }

  private getWebviewUri(filePath: string): vscode.Uri | undefined {
    if (!this.panel || !this.workspaceRoot) {
      return undefined;
    }
    const fileUri = vscode.Uri.file(filePath);
    return this.panel.webview.asWebviewUri(fileUri);
  }

  private updateIcons(): void {
    if (!this.panel) {
      return;
    }

    const cardsHtml = renderIconCards(this.filteredAssets, this.panel.webview, this.workspaceRoot);

    this.panel.webview.postMessage({
      command: "updateIcons",
      icons: cardsHtml,
      count: this.filteredAssets.length,
      total: this.assets.length,
    });
  }

  private updateFull(): void {
    if (!this.panel) {
      return;
    }

    const styles = getStyles(this.iconSize);
    const scripts = getScripts();
    const cardsHtml = renderIconCards(this.filteredAssets, this.panel.webview, this.workspaceRoot);
    const directoriesOptions = renderDirectoryOptions(
      this.directories,
      this.selectedDirectory,
    );
    const formatOptions = renderFormatOptions(this.selectedFormats);
    const statsText = renderStats(this.filteredAssets.length, this.assets.length);

    this.panel.webview.html = getWebviewHtml(
      styles,
      scripts,
      this.searchQuery,
      directoriesOptions,
      formatOptions,
      cardsHtml,
      statsText,
    );
  }

  private async copyName(name: string): Promise<void> {
    await vscode.env.clipboard.writeText(name);
    vscode.window.showInformationMessage("Asset name copied to clipboard!");
  }

  private async copyImport(filePath: string, name: string): Promise<void> {
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, "");
    const importCode = `import ${sanitizedName} from '${filePath}';`;
    await vscode.env.clipboard.writeText(importCode);
    vscode.window.showInformationMessage("Import code copied to clipboard!");
  }

  private async openFile(filePath: string): Promise<void> {
    const uri = vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(uri);
  }
}
```

- [ ] **Step 2: 验证编译通过**

Run: `cd d:/my-project/svg-icon-manager && npm run compile`
Expected: 可能有 templates.ts 的错误，下一步修复

- [ ] **Step 3: 提交**

```bash
git add src/webview/index.ts
git commit -m "feat(panel): add format filter state and message handling"
```

---

## Task 4: 更新 HTML 模板

**Files:**
- Modify: `src/webview/templates.ts`

- [ ] **Step 1: 添加格式筛选器、图片卡片渲染、预览 Modal**

```typescript
import * as vscode from "vscode";
import { ImageAsset, ImageFormat } from "../types";

/**
 * SVG icons for action buttons
 */
const actionIcons = {
  copyName: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
  </svg>`,

  copyImport: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
  </svg>`,

  openFile: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
  </svg>`,

  refresh: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
    <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
  </svg>`,

  zoomIn: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8zm5-1a1 1 0 011-1h1V5a1 1 0 112 0v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V8H6a1 1 0 01-1-1z" clip-rule="evenodd"/>
  </svg>`,
};

/**
 * Render an action button
 */
function actionButton(action: "copyName" | "copyImport" | "openFile", title: string): string {
  return `<button class="action-btn" data-action="${action}" title="${title}">
    ${actionIcons[action]}
  </button>`;
}

/**
 * Render a single asset card
 */
export function renderIconCard(
  asset: ImageAsset,
  webview?: vscode.Webview,
  workspaceRoot?: string
): string {
  const isImage = asset.format !== 'svg';

  // 生成预览内容
  let previewContent: string;
  if (asset.format === 'svg' && asset.content) {
    // SVG 内联渲染
    previewContent = asset.content;
  } else if (webview && workspaceRoot) {
    // 图片使用 webview URI
    const fileUri = vscode.Uri.file(asset.path);
    const webviewUri = webview.asWebviewUri(fileUri);
    previewContent = `<img src="${webviewUri}" alt="${asset.name}" loading="lazy" />`;
  } else {
    previewContent = `<span class="preview-placeholder">${asset.format.toUpperCase()}</span>`;
  }

  // 图片卡片添加点击预览功能
  const previewClickAttr = isImage ? `data-preview="true" data-src="${asset.path}"` : '';

  return `
    <div class="icon-card" data-path="${asset.path}" data-name="${asset.name}" data-relative="${asset.relativePath}" data-format="${asset.format}">
      <div class="icon-preview ${isImage ? 'image-preview' : ''}" ${previewClickAttr}>
        ${previewContent}
        ${isImage ? `<div class="image-overlay">${actionIcons.zoomIn}</div>` : ''}
      </div>
      <div class="icon-info">
        <div class="icon-name" title="${asset.name}">${asset.name}</div>
        <div class="icon-path" title="${asset.relativePath}">${asset.relativePath}</div>
        <div class="icon-size">${asset.size.width > 0 ? `${asset.size.width}×${asset.size.height}` : asset.format.toUpperCase()}</div>
      </div>
      <div class="card-actions">
        ${actionButton("copyName", "Copy Name")}
        ${actionButton("copyImport", "Copy Import")}
        ${actionButton("openFile", "Open File")}
      </div>
    </div>
  `;
}

/**
 * Render all asset cards
 */
export function renderIconCards(
  assets: ImageAsset[],
  webview?: vscode.Webview,
  workspaceRoot?: string
): string {
  return assets.map(asset => renderIconCard(asset, webview, workspaceRoot)).join("");
}

/**
 * Render directory select options
 */
export function renderDirectoryOptions(
  directories: string[],
  selectedDirectory: string,
): string {
  return directories
    .map(
      (dir) =>
        `<option value="${dir}" ${selectedDirectory === dir ? "selected" : ""}>${dir}</option>`,
    )
    .join("");
}

/**
 * Render format filter options
 */
export function renderFormatOptions(selectedFormats: ImageFormat[]): string {
  const formats: ImageFormat[] = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'ico', 'bmp'];
  return formats
    .map(format =>
      `<option value="${format}" ${selectedFormats.includes(format) ? "selected" : ""}>${format.toUpperCase()}</option>`
    )
    .join("");
}

/**
 * Render header stats text
 */
export function renderStats(filteredCount: number, totalCount: number): string {
  const assetText = filteredCount === 1 ? "asset" : "assets";
  const filteredText =
    filteredCount !== totalCount ? ` (filtered from ${totalCount})` : "";
  return `${filteredCount} ${assetText}${filteredText}`;
}

/**
 * Render preview modal HTML
 */
function renderPreviewModal(): string {
  return `
    <div class="preview-modal" id="previewModal">
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <button class="modal-close" id="modalClose">✕</button>
        <img class="preview-image" id="previewImage" src="" alt="Preview" />
        <div class="modal-info">
          <span class="file-name" id="previewFileName"></span>
          <span class="file-size" id="previewFileSize"></span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Get the full HTML document
 */
export function getWebviewHtml(
  styles: string,
  scripts: string,
  searchQuery: string,
  directoriesOptions: string,
  formatOptions: string,
  cardsHtml: string,
  statsText: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob: vscode-webview-resource: https: file:; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>Image Asset Manager</title>
  <style>
${styles}
  </style>
</head>
<body>
  <div class="header">
    <h1>Image Assets</h1>
    <div class="filters">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="searchInput" placeholder="Search assets..." value="${searchQuery}">
      </div>
      <div class="format-filter">
        <select id="formatFilter" multiple size="1">
          ${formatOptions}
        </select>
        <span class="format-hint">Ctrl+click to multi-select</span>
      </div>
      <div class="path-filter">
        <select id="pathFilter">
          <option value="">All Directories</option>
          ${directoriesOptions}
        </select>
      </div>
    </div>
    <button class="refresh-btn" id="refreshBtn">
      ${actionIcons.refresh}
      Refresh
    </button>
    <div class="header-stats">
      ${statsText}
    </div>
  </div>

  <div class="icons-grid" id="iconsGrid">
    ${cardsHtml}
  </div>

  ${renderPreviewModal()}

  <script>
${scripts}
  </script>
</body>
</html>`;
}
```

- [ ] **Step 2: 验证编译通过**

Run: `cd d:/my-project/svg-icon-manager && npm run compile`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add src/webview/templates.ts
git commit -m "feat(templates): add format filter, image card rendering, preview modal"
```

---

## Task 5: 更新客户端脚本

**Files:**
- Modify: `src/webview/scripts.ts`

- [ ] **Step 1: 添加格式筛选交互、Modal 控制、懒加载**

```typescript
/**
 * Webview JavaScript code
 * This code runs in the webview context
 */

export function getScripts(): string {
  return `
const vscode = acquireVsCodeApi();

// Listen for messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'updateIcons':
            handleUpdateIcons(message);
            break;
    }
});

function handleUpdateIcons(message) {
    document.getElementById('iconsGrid').innerHTML = message.icons;
    document.querySelector('.header-stats').innerHTML =
       \`\${message.count} \${message.count === 1 ? 'asset' : 'assets'}\` +
        (message.count !== message.total ? \` (filtered from \${message.total})\` : '');
    // 重新绑定图片点击事件
    bindImagePreviewEvents();
}

// Search with debounce
let searchTimeout;
document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        vscode.postMessage({
            command: 'search',
            query: e.target.value
        });
    }, 300);
});

// Format filter - multi-select
let formatChangeTimeout;
document.getElementById('formatFilter').addEventListener('change', (e) => {
    clearTimeout(formatChangeTimeout);
    formatChangeTimeout = setTimeout(() => {
        const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
        vscode.postMessage({
            command: 'filterByFormat',
            formats: selected
        });
    }, 300);
});

// Directory filter
document.getElementById('pathFilter').addEventListener('change', (e) => {
    vscode.postMessage({
        command: 'filterByPath',
        path: e.target.value
    });
});

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', () => {
    vscode.postMessage({ command: 'refresh' });
});

// Icon card actions
document.getElementById('iconsGrid').addEventListener('click', (e) => {
    const actionBtn = e.target.closest('.action-btn');

    if (actionBtn) {
        e.stopPropagation();
        const action = actionBtn.dataset.action;
        const card = actionBtn.closest('.icon-card');

        switch (action) {
            case 'copyName':
                vscode.postMessage({
                    command: 'copyName',
                    name: card.dataset.name
                });
                break;
            case 'copyImport':
                vscode.postMessage({
                    command: 'copyImport',
                    path: card.dataset.path,
                    name: card.dataset.name
                });
                break;
            case 'openFile':
                vscode.postMessage({
                    command: 'openFile',
                    path: card.dataset.path
                });
                break;
        }
    }
});

// Image preview functionality
function bindImagePreviewEvents() {
    const imagePreviews = document.querySelectorAll('.icon-preview[data-preview="true"]');
    imagePreviews.forEach(preview => {
        preview.addEventListener('click', (e) => {
            if (e.target.closest('.action-btn')) return;
            openPreviewModal(preview.dataset.src, preview.closest('.icon-card'));
        });
    });
}

function openPreviewModal(src, card) {
    const modal = document.getElementById('previewModal');
    const img = document.getElementById('previewImage');
    const fileName = document.getElementById('previewFileName');
    const fileSize = document.getElementById('previewFileSize');

    // 获取图片 URI (需要通过扩展传递)
    img.src = card.querySelector('img')?.src || '';
    fileName.textContent = card.dataset.name;
    fileSize.textContent = card.querySelector('.icon-size')?.textContent || '';

    modal.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function closePreviewModal() {
    const modal = document.getElementById('previewModal');
    modal.classList.remove('visible');
    document.body.style.overflow = '';
}

// Modal close events
document.getElementById('modalClose').addEventListener('click', closePreviewModal);
document.querySelector('.modal-backdrop').addEventListener('click', closePreviewModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePreviewModal();
    }
});

// Initial bind
bindImagePreviewEvents();
`;
}
```

- [ ] **Step 2: 验证编译通过**

Run: `cd d:/my-project/svg-icon-manager && npm run compile`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add src/webview/scripts.ts
git commit -m "feat(scripts): add format filter interaction and image preview modal"
```

---

## Task 6: 更新样式

**Files:**
- Modify: `src/webview/styles.ts`

- [ ] **Step 1: 添加格式筛选器、Modal、图片遮罩样式**

在 `src/webview/styles.ts` 中添加以下样式模块：

```typescript
/**
 * CSS Styles for the webview
 * Organized by component for better maintainability
 */

export function getStyles(iconSize: number): string {
  return `
${baseStyles}
${headerStyles}
${filterStyles}
${gridStyles}
${cardStyles(iconSize)}
${modalStyles}
${scrollbarStyles}
${emptyStateStyles}
`;
}

const baseStyles = `
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    background-color: var(--vscode-editor-background);
    padding: 20px;
    height: 100vh;
    display: flex;
    flex-direction: column;
}
`;

const headerStyles = `
.header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.header h1 {
    font-size: 24px;
    font-weight: 600;
    color: var(--vscode-foreground);
}

.header-stats {
    color: var(--vscode-descriptionForeground);
    font-size: 14px;
}
`;

const filterStyles = `
.filters {
    display: flex;
    gap: 12px;
    flex: 1;
    max-width: 800px;
    flex-wrap: wrap;
}

.search-box {
    flex: 1;
    min-width: 200px;
    position: relative;
}

.search-box input {
    width: 100%;
    padding: 8px 12px 8px 36px;
    border: 1px solid var(--vscode-input-border);
    background-color: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
}

.search-box input:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
}

.search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    line-height: 16px;
    transform: translateY(-50%);
    color: var(--vscode-descriptionForeground);
}

.format-filter {
    min-width: 120px;
    position: relative;
}

.format-filter select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--vscode-input-border);
    background-color: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
    cursor: pointer;
}

.format-filter select:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
}

.format-hint {
    display: block;
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    margin-top: 2px;
    opacity: 0.7;
}

.path-filter {
    min-width: 150px;
}

.path-filter select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--vscode-input-border);
    background-color: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
    cursor: pointer;
}

.path-filter select:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
}

.refresh-btn {
    padding: 8px 16px;
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-family: inherit;
    display: flex;
    align-items: center;
    gap: 6px;
}

.refresh-btn:hover {
    background-color: var(--vscode-button-hoverBackground);
}
`;

const gridStyles = `
.icons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
    overflow-y: auto;
    flex: 1;
    padding-right: 8px;
    align-content: start;
    min-height: 0;
}
`;

function cardStyles(iconSize: number): string {
  return `
.icon-card {
    background-color: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
}

.icon-card:hover {
    border-color: var(--vscode-focusBorder);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.icon-preview {
    width: ${iconSize}px;
    height: ${iconSize}px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--vscode-editor-background);
    border-radius: 8px;
    position: relative;
    overflow: hidden;
}

.icon-preview svg {
    width: 100%;
    height: 100%;
    max-width: 64px;
    max-height: 64px;
}

.icon-preview img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.icon-preview.image-preview {
    cursor: zoom-in;
}

.image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    border-radius: 8px;
}

.image-overlay svg {
    width: 24px;
    height: 24px;
    color: white;
}

.icon-preview.image-preview:hover .image-overlay {
    opacity: 1;
}

.preview-placeholder {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    opacity: 0.5;
}

.icon-info {
    width: 100%;
    text-align: center;
}

.icon-name {
    font-weight: 600;
    font-size: 14px;
    color: var(--vscode-foreground);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 4px;
}

.icon-path {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 2px;
}

.icon-size {
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
}

.card-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.icon-card:hover .card-actions {
    opacity: 1;
}

.action-btn {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 4px;
    background-color: var(--vscode-editor-background);
    color: var(--vscode-foreground);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
}

.action-btn:hover {
    background-color: var(--vscode-toolbar-hoverBackground);
}
`;
}

const modalStyles = `
.preview-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    align-items: center;
    justify-content: center;
}

.preview-modal.visible {
    display: flex;
}

.modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    cursor: pointer;
}

.modal-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--vscode-editor-background);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.modal-close {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 4px;
    background-color: var(--vscode-toolbar-hoverBackground);
    color: var(--vscode-foreground);
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-close:hover {
    background-color: var(--vscode-button-hoverBackground);
}

.preview-image {
    max-width: 100%;
    max-height: calc(90vh - 80px);
    object-fit: contain;
    border-radius: 4px;
}

.modal-info {
    margin-top: 12px;
    text-align: center;
    display: flex;
    gap: 16px;
    color: var(--vscode-descriptionForeground);
    font-size: 13px;
}
`;

const scrollbarStyles = `
::-webkit-scrollbar {
    width: 10px;
}

::-webkit-scrollbar-track {
    background: var(--vscode-editor-background);
}

::-webkit-scrollbar-thumb {
    background: var(--vscode-scrollbarSlider-background);
    border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--vscode-scrollbarSlider-hoverBackground);
}
`;

const emptyStateStyles = `
.empty-state {
    text-align: center;
    padding: 40px;
    color: var(--vscode-descriptionForeground);
}

.empty-state svg {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
}
`;
```

- [ ] **Step 2: 验证编译通过**

Run: `cd d:/my-project/svg-icon-manager && npm run compile`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add src/webview/styles.ts
git commit -m "feat(styles): add format filter, modal, and image overlay styles"
```

---

## Task 7: 更新 package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 更新扩展描述和关键词**

将 `package.json` 中的描述更新：

```json
{
  "name": "svg-icon-manager",
  "displayName": "Image Asset Manager",
  "description": "Scan, preview, and manage all image assets (SVG, PNG, JPG, WebP, GIF, ICO, BMP) in your workspace with a beautiful card-based gallery",
  "keywords": [
    "svg",
    "icon",
    "image",
    "assets",
    "preview",
    "gallery",
    "manager",
    "icons",
    "png",
    "jpg",
    "webp",
    "gif"
  ]
}
```

- [ ] **Step 2: 提交**

```bash
git add package.json
git commit -m "chore: update package description for multi-format support"
```

---

## Task 8: 集成测试

**Files:**
- 无文件修改，仅测试

- [ ] **Step 1: 编译项目**

Run: `cd d:/my-project/svg-icon-manager && npm run compile`
Expected: 编译成功，无错误

- [ ] **Step 2: 在 VS Code 中测试**

1. 按 F5 启动扩展开发宿主
2. 打开命令面板，运行 "Show SVG Icon Manager"
3. 验证以下功能：
   - 格式筛选器显示，默认选中 svg
   - 可以多选格式（Ctrl+点击）
   - 图片卡片正确渲染
   - 点击图片卡片预览区打开 Modal
   - Modal 可以通过点击遮罩、关闭按钮或 Esc 关闭
   - 搜索和目录筛选仍然正常工作

- [ ] **Step 3: 最终提交（如有修改）**

```bash
git add -A
git commit -m "test: verify multi-format image support"
```

---

## Spec Coverage Check

| 需求 | 任务 |
|------|------|
| 支持多种图片格式 | Task 2 (Scanner) |
| 格式筛选器（多选，默认 svg） | Task 3, 4, 5 |
| 图片卡片渲染 | Task 4 (templates) |
| 点击预览大图 Modal | Task 4, 5, 6 |
| ES Module import | Task 3 (copyImport) |
| file URI 而非 base64 | Task 3, 4 |
| Promise.allSettled | Task 2 |
| 懒加载 | Task 5 (loading="lazy") |
