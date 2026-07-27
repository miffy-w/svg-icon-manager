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
    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
  </svg>`,

  refresh: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
    <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
  </svg>`,

  zoomIn: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8zm5-1a1 1 0 011-1h1V5a1 1 0 112 0v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V8H6a1 1 0 01-1-1z" clip-rule="evenodd"/>
  </svg>`,
};

const folderIcon = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
  <path d="M1.5 3.5h4.586a1 1 0 01.707.293L8.207 5.207A1 1 0 008.914 5.5H14.5A1.5 1.5 0 0116 7v5.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 010 12.5v-9A1.5 1.5 0 011.5 2h4.086l1.414 1.414a.5.5 0 00.354.146H14.5a.5.5 0 01.5.5V7H1.5v5.5a.5.5 0 00.5.5h13a.5.5 0 00.5-.5V7z"/>
</svg>`;

const searchIcon = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
  <path fill-rule="evenodd" d="M11.5 7a4.499 4.499 0 11-8.998 0A4.499 4.499 0 0111.5 7zm-.82 4.74a6 6 0 111.06-1.06l3.04 3.04a.75.75 0 11-1.06 1.06l-3.04-3.04z"/>
</svg>`;

const chevronIcon = `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
  <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"/>
</svg>`;

/**
 * Render an action button
 */
function actionButton(
  action: "copyName" | "copyImport" | "openFile",
  title: string,
): string {
  return `<button class="action-btn" data-action="${action}" title="${title}">
    ${actionIcons[action]}
  </button>`;
}

/**
 * Escape special characters for safe interpolation into HTML text/attributes
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Format file size in bytes to human-readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Render a single asset card
 */
export function renderIconCard(
  asset: ImageAsset,
  webview?: vscode.Webview,
  workspaceRoot?: string,
  hidden: boolean = false,
): string {
  const isImage = asset.format !== "svg";
  const safeName = escapeHtml(asset.name);
  const safeRelative = escapeHtml(asset.relativePath);
  const safePath = escapeHtml(asset.path);

  // 生成预览内容
  let previewContent: string;
  if (asset.format === "svg" && asset.content) {
    // SVG 内联渲染
    previewContent = asset.content;
  } else if (webview && workspaceRoot) {
    // 图片使用 webview URI
    const fileUri = vscode.Uri.file(asset.path);
    const webviewUri = webview.asWebviewUri(fileUri);
    previewContent = `<img src="${webviewUri}" alt="${safeName}" loading="lazy" />`;
  } else {
    previewContent = `<span class="preview-placeholder">${asset.format.toUpperCase()}</span>`;
  }

  // 图片卡片添加点击预览功能
  const previewClickAttr = isImage
    ? `data-preview="true" data-src="${safePath}"`
    : "";

  // 尺寸信息文本
  const dimText =
    asset.size.width > 0
      ? `${asset.size.width}×${asset.size.height}`
      : asset.format.toUpperCase();
  const fileSizeText = asset.fileSize ? formatFileSize(asset.fileSize) : "";

  return `
    <div class="icon-card${hidden ? " hidden" : ""}" data-path="${safePath}" data-name="${safeName}" data-relative="${safeRelative}" data-format="${asset.format}" data-filesize="${asset.fileSize || ""}">
      <div class="icon-preview ${isImage ? "image-preview" : ""}" ${previewClickAttr}>
        ${previewContent}
        ${isImage ? `<div class="image-overlay"></div>` : ""}
      </div>
      <div class="icon-info">
        <div class="icon-name" title="${safeName}">${safeName}</div>
        <div class="icon-path" title="${safeRelative}">${safeRelative}</div>
        <div class="icon-meta">${dimText}${fileSizeText ? ` · ${fileSizeText}` : ""}</div>
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
 * @param visibleSet 可见资源的 relativePath 集合，未提供时全部可见
 */
export function renderIconCards(
  assets: ImageAsset[],
  webview?: vscode.Webview,
  workspaceRoot?: string,
  visibleSet?: Set<string>,
): string {
  return assets
    .map((asset) =>
      renderIconCard(
        asset,
        webview,
        workspaceRoot,
        visibleSet ? !visibleSet.has(asset.relativePath) : false,
      ),
    )
    .join("");
}

/**
 * Render custom directory dropdown with hierarchy and search
 */
export function renderDirectoryDropdown(
  directories: string[],
  selectedDirectory: string,
  dirCounts: Map<string, number>,
  totalCount: number,
): string {
  // 触发按钮回显完整路径，过长时 CSS 截断，tooltip 显示全部
  const triggerText = escapeHtml(selectedDirectory || "All Directories");
  const filteredClass = selectedDirectory ? "filtered" : "";

  // 构建 父目录 -> 子目录 映射，用于折叠箭头与树形连接线（├/└）绘制
  const childrenMap = new Map<string, string[]>();
  directories.forEach((dir) => {
    const idx = dir.lastIndexOf("/");
    const parent = idx > 0 ? dir.slice(0, idx) : "";
    const list = childrenMap.get(parent);
    if (list) {
      list.push(dir);
    } else {
      childrenMap.set(parent, [dir]);
    }
  });
  // 目录已按层级排序，同父目录的最后一项即最后一个子节点
  const isLastChild = (dir: string): boolean => {
    const idx = dir.lastIndexOf("/");
    const parent = idx > 0 ? dir.slice(0, idx) : "";
    const siblings = childrenMap.get(parent);
    return !siblings || siblings[siblings.length - 1] === dir;
  };

  const itemsHtml = directories
    .map((dir) => {
      const parts = dir.split("/");
      const depth = parts.length - 1;
      const leaf = parts[parts.length - 1];
      const activeClass = selectedDirectory === dir ? "active" : "";
      const count = dirCounts.get(dir) ?? 0;
      // 逐列绘制树形连接线：最后一列画 ├（还有兄弟）或 └（最后一个），
      // 中间列在对应祖先还有后续兄弟时画贯穿竖线，否则留空
      let guides = "";
      for (let col = 0; col < depth; col++) {
        if (col === depth - 1) {
          const branchClass = isLastChild(dir)
            ? "dir-guide-elbow"
            : "dir-guide-tee";
          guides += `<span class="dir-indent-guide ${branchClass}"></span>`;
        } else {
          const ancestor = parts.slice(0, col + 2).join("/");
          const passClass = isLastChild(ancestor)
            ? "dir-guide-blank"
            : "dir-guide-line";
          guides += `<span class="dir-indent-guide ${passClass}"></span>`;
        }
      }
      // 有子目录显示折叠箭头，叶子目录用占位符保持对齐
      const twisty = childrenMap.has(dir)
        ? `<span class="dir-twisty">${chevronIcon}</span>`
        : `<span class="dir-twisty dir-twisty-placeholder"></span>`;
      // dir-label 与 dir-path-label 互斥显示：默认树形展示叶子名，搜索时平铺展示完整路径
      const safeDir = escapeHtml(dir);
      const safeLeaf = escapeHtml(leaf);
      return `<div class="dir-dropdown-item ${activeClass}" data-dir="${safeDir}" data-search="${escapeHtml(dir.toLowerCase())}" title="${safeDir}">
        ${guides}
        ${twisty}
        ${folderIcon}
        <span class="dir-label">${safeLeaf}</span>
        <span class="dir-path-label">${safeDir}</span>
        <span class="dir-count">${count}</span>
      </div>`;
    })
    .join("");

  return `
    <div class="dir-dropdown" id="dirDropdown">
      <button class="dir-dropdown-trigger ${filteredClass}" id="dirDropdownTrigger" title="${triggerText}">
        ${folderIcon}
        <span class="dir-trigger-text">${triggerText}</span>
        <span class="dir-trigger-arrow">▾</span>
      </button>
      <div class="dir-dropdown-panel" id="dirDropdownPanel">
        <div class="dir-dropdown-search">
          ${searchIcon}
          <input type="text" id="dirDropdownSearch" placeholder="Filter directories..." autocomplete="off" />
        </div>
        <div class="dir-dropdown-list" id="dirDropdownList">
          <div class="dir-dropdown-item dir-all ${!selectedDirectory ? "active" : ""}" data-dir="" data-search="all directories" title="All Directories">
            <span class="dir-twisty dir-twisty-placeholder"></span>
            ${folderIcon}
            <span class="dir-label">All Directories</span>
            <span class="dir-path-label">All Directories</span>
            <span class="dir-count">${totalCount}</span>
          </div>
          ${itemsHtml}
        </div>
        <div class="dir-dropdown-empty" id="dirDropdownEmpty">No directories found</div>
      </div>
    </div>
  `;
}

/**
 * Render directory select options (DEPRECATED: use renderDirectoryDropdown instead)
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
 * Render format filter chips (checkbox-based toggle UI)
 */
export function renderFormatOptions(selectedFormats: ImageFormat[]): string {
  const formats: ImageFormat[] = [
    "svg",
    "png",
    "jpg",
    "webp",
    "gif",
    "ico",
    "bmp",
  ];
  return formats
    .map(
      (format) =>
        `<label class="format-chip ${selectedFormats.includes(format) ? "active" : ""}">
          <input type="checkbox" value="${format}" ${selectedFormats.includes(format) ? "checked" : ""} />
          ${format.toUpperCase()}
        </label>`,
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
        <div class="modal-header">
          <div class="modal-header-left">
            <span class="file-name" id="previewFileName"></span>
            <span class="file-size" id="previewFileSize"></span>
          </div>
          <button class="modal-close" id="modalClose">✕</button>
        </div>
        <img class="preview-image" id="previewImage" src="" alt="Preview" />
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
  directoriesDropdown: string,
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
      <div class="format-filter" id="formatFilter">
        ${formatOptions}
      </div>
      <div class="path-filter">
        ${directoriesDropdown}
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
