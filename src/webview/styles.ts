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
    max-width: 600px;
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

.path-filter {
    min-width: 200px;
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
}

.icon-preview svg {
    width: 100%;
    height: 100%;
    max-width: 64px;
    max-height: 64px;
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
