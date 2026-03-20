import { SvgIcon } from "../types";

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
 * Render a single icon card
 */
export function renderIconCard(icon: SvgIcon): string {
  return `
    <div class="icon-card" data-path="${icon.path}" data-name="${icon.name}" data-relative="${icon.relativePath}">
      <div class="icon-preview">
        ${icon.content}
      </div>
      <div class="icon-info">
        <div class="icon-name" title="${icon.name}">${icon.name}</div>
        <div class="icon-path" title="${icon.relativePath}">${icon.relativePath}</div>
        <div class="icon-size">${icon.size.width}×${icon.size.height}</div>
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
 * Render all icon cards
 */
export function renderIconCards(icons: SvgIcon[]): string {
  return icons.map(renderIconCard).join("");
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
 * Render header stats text
 */
export function renderStats(filteredCount: number, totalCount: number): string {
  const iconText = filteredCount === 1 ? "icon" : "icons";
  const filteredText =
    filteredCount !== totalCount ? ` (filtered from ${totalCount})` : "";
  return `${filteredCount} ${iconText}${filteredText}`;
}

/**
 * Get the full HTML document
 */
export function getWebviewHtml(
  styles: string,
  scripts: string,
  searchQuery: string,
  directoriesOptions: string,
  cardsHtml: string,
  statsText: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>SVG Icon Manager</title>
  <style>
${styles}
  </style>
</head>
<body>
  <div class="header">
    <h1>SVG Icons</h1>
    <div class="filters">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="searchInput" placeholder="Search icons..." value="${searchQuery}">
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

  <script>
${scripts}
  </script>
</body>
</html>`;
}
