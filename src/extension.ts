import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface SvgIcon {
    name: string;
    path: string;
    relativePath: string;
    size: { width: number; height: number };
    content: string;
}

class IconScanner {
    private icons: SvgIcon[] = [];
    private ignorePatterns: string[] = [];

    constructor(private workspaceRoot: string | undefined) {
        this.loadConfig();
    }

    private loadConfig() {
        const config = vscode.workspace.getConfiguration('svgIconManager');
        this.ignorePatterns = config.get<string[]>('ignorePatterns', ['node_modules', '.git', 'out', 'dist', 'build', 'coverage']);
    }

    async scan(): Promise<SvgIcon[]> {
        this.icons = [];
        this.loadConfig();
        
        if (!this.workspaceRoot) {
            return this.icons;
        }

        const svgFiles = await this.findSvgFiles(this.workspaceRoot);
        
        for (const filePath of svgFiles) {
            try {
                const icon = await this.parseSvgFile(filePath);
                if (icon) {
                    this.icons.push(icon);
                }
            } catch (error) {
                console.error(`Error parsing SVG file ${filePath}:`, error);
            }
        }
        
        this.icons.sort((a, b) => a.name.localeCompare(b.name));
        return this.icons;
    }

    private async findSvgFiles(dir: string, depth: number = 0, maxDepth: number = 10): Promise<string[]> {
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
                    const subFiles = await this.findSvgFiles(fullPath, depth + 1, maxDepth);
                    files.push(...subFiles);
                } else if (entry.name.toLowerCase().endsWith('.svg')) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            console.error(`Error reading directory ${dir}:`, error);
        }
        
        return files;
    }

    private async parseSvgFile(filePath: string): Promise<SvgIcon | null> {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const relativePath = path.relative(this.workspaceRoot!, filePath);
            const name = path.basename(filePath, '.svg');
            
            const widthMatch = content.match(/width=["'](\d+(?:\.\d+)?)(?:px|)?["']/i);
            const heightMatch = content.match(/height=["'](\d+(?:\.\d+)?)(?:px|)?["']/i);
            const viewBoxMatch = content.match(/viewBox=["'](\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)["']/i);
            
            let width = 0;
            let height = 0;
            
            if (widthMatch && heightMatch) {
                width = parseFloat(widthMatch[1]);
                height = parseFloat(heightMatch[1]);
            } else if (viewBoxMatch) {
                width = parseFloat(viewBoxMatch[3]);
                height = parseFloat(viewBoxMatch[4]);
            }
            
            return {
                name,
                path: filePath,
                relativePath: relativePath.replace(/\\/g, '/'),
                size: { width, height },
                content
            };
        } catch (error) {
            console.error(`Error parsing SVG file ${filePath}:`, error);
            return null;
        }
    }
}

class IconPanel {
    private panel: vscode.WebviewPanel | undefined;
    private icons: SvgIcon[] = [];
    private filteredIcons: SvgIcon[] = [];
    private directories: string[] = [];
    private selectedDirectory: string = '';
    private searchQuery: string = '';
    private scanner: IconScanner;

    constructor(private context: vscode.ExtensionContext, private workspaceRoot: string | undefined, scanner: IconScanner) {
        this.scanner = scanner;
    }

    async show() {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'svgIconManager',
            'SVG Icon Manager',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: []
            }
        );

        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'search':
                        this.searchQuery = message.query;
                        this.applyFilters();
                        break;
                    case 'filterByPath':
                        this.selectedDirectory = message.path;
                        this.applyFilters();
                        break;
                    case 'copyPath':
                        this.copyPath(message.path);
                        break;
                    case 'copyImport':
                        this.copyImport(message.path, message.name);
                        break;
                    case 'openFile':
                        this.openFile(message.path);
                        break;
                    case 'refresh':
                        await this.refresh();
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        }, null, this.context.subscriptions);

        await this.refresh();
    }

    async refresh() {
        this.icons = await this.scanner.scan();
        this.directories = this.extractDirectories(this.icons);
        this.filteredIcons = [...this.icons];
        this.updateFull();
    }

    private updateFull() {
        if (this.panel) {
            this.panel.webview.html = this.getWebviewContent();
        }
    }

    private extractDirectories(icons: SvgIcon[]): string[] {
        const dirSet = new Set<string>();
        icons.forEach(icon => {
            const dir = path.dirname(icon.relativePath);
            if (dir !== '.') {
                dirSet.add(dir);
            }
        });
        return Array.from(dirSet).sort();
    }

    private applyFilters() {
        let result = [...this.icons];
        
        // Apply directory filter
        if (this.selectedDirectory) {
            result = result.filter(icon => {
                const dir = path.dirname(icon.relativePath);
                return dir === this.selectedDirectory;
            });
        }
        
        // Apply search filter
        if (this.searchQuery.trim()) {
            const lowerQuery = this.searchQuery.toLowerCase();
            result = result.filter(icon =>
                icon.name.toLowerCase().includes(lowerQuery) ||
                icon.relativePath.toLowerCase().includes(lowerQuery)
            );
        }
        
        this.filteredIcons = result;
        this.updateIcons();
    }

    private updateIcons() {
        if (this.panel) {
            const cardsHtml = this.filteredIcons.map(icon => `
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
                        <button class="action-btn" data-action="copyPath" title="Copy Path">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                            </svg>
                        </button>
                        <button class="action-btn" data-action="copyImport" title="Copy Import">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                            </svg>
                        </button>
                        <button class="action-btn" data-action="openFile" title="Open File">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('');
            
            this.panel.webview.postMessage({
                command: 'updateIcons',
                icons: cardsHtml,
                count: this.filteredIcons.length,
                total: this.icons.length
            });
        }
    }

    private getWebviewContent(): string {
        const cardsHtml = this.filteredIcons.map(icon => `
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
                    <button class="action-btn" data-action="copyPath" title="Copy Path">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                        </svg>
                    </button>
                    <button class="action-btn" data-action="copyImport" title="Copy Import">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                        </svg>
                    </button>
                    <button class="action-btn" data-action="openFile" title="Open File">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        const directoriesOptions = this.directories.map(dir => 
            `<option value="${dir}" ${this.selectedDirectory === dir ? 'selected' : ''}>${dir}</option>`
        ).join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SVG Icon Manager</title>
    <style>
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
            width: 80px;
            height: 80px;
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
    </style>
</head>
<body>
    <div class="header">
        <h1>SVG Icons</h1>
        <div class="header-stats">
            ${this.filteredIcons.length} ${this.filteredIcons.length === 1 ? 'icon' : 'icons'}
            ${this.filteredIcons.length !== this.icons.length ? `(filtered from ${this.icons.length})` : ''}
        </div>
        <div class="filters">
            <div class="search-box">
                <span class="search-icon">🔍</span>
                <input type="text" id="searchInput" placeholder="Search icons..." value="${this.searchQuery}">
            </div>
            <div class="path-filter">
                <select id="pathFilter">
                    <option value="">All Directories</option>
                    ${directoriesOptions}
                </select>
            </div>
        </div>
        <button class="refresh-btn" id="refreshBtn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
                <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
            </svg>
            Refresh
        </button>
    </div>
    
    <div class="icons-grid" id="iconsGrid">
        ${cardsHtml}
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateIcons':
                    document.getElementById('iconsGrid').innerHTML = message.icons;
                    document.querySelector('.header-stats').innerHTML = 
                        \`\${message.count} \${message.count === 1 ? 'icon' : 'icons'}\` +
                        (message.count !== message.total ? \` (filtered from \${message.total})\` : '');
                    break;
            }
        });
        
        document.getElementById('searchInput').addEventListener('input', (e) => {
            vscode.postMessage({
                command: 'search',
                query: e.target.value
            });
        });
        
        document.getElementById('pathFilter').addEventListener('change', (e) => {
            vscode.postMessage({
                command: 'filterByPath',
                path: e.target.value
            });
        });
        
        document.getElementById('refreshBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'refresh' });
        });
        
        document.getElementById('iconsGrid').addEventListener('click', (e) => {
            const card = e.target.closest('.icon-card');
            const actionBtn = e.target.closest('.action-btn');
            
            if (actionBtn) {
                e.stopPropagation();
                const action = actionBtn.dataset.action;
                const card = actionBtn.closest('.icon-card');
                
                if (action === 'copyPath') {
                    vscode.postMessage({
                        command: 'copyPath',
                        path: card.dataset.path
                    });
                } else if (action === 'copyImport') {
                    vscode.postMessage({
                        command: 'copyImport',
                        path: card.dataset.path,
                        name: card.dataset.name
                    });
                } else if (action === 'openFile') {
                    vscode.postMessage({
                        command: 'openFile',
                        path: card.dataset.path
                    });
                }
            } else if (card) {
                vscode.postMessage({
                    command: 'openFile',
                    path: card.dataset.path
                });
            }
        });
    </script>
</body>
</html>`;
    }

    private async copyPath(path: string) {
        await vscode.env.clipboard.writeText(path);
        vscode.window.showInformationMessage('Path copied to clipboard!');
    }

    private async copyImport(path: string, name: string) {
        const importCode = `import ${name.replace(/[^a-zA-Z0-9]/g, '')} from '${path}';`;
        await vscode.env.clipboard.writeText(importCode);
        vscode.window.showInformationMessage('Import code copied to clipboard!');
    }

    private async openFile(path: string) {
        const uri = vscode.Uri.file(path);
        await vscode.window.showTextDocument(uri);
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('SVG Icon Manager is now active!');
    
    const workspaceRoot = vscode.workspace.rootPath;
    const scanner = new IconScanner(workspaceRoot);
    const iconPanel = new IconPanel(context, workspaceRoot, scanner);
    
    // Show panel command
    const showPanelCommand = vscode.commands.registerCommand('svgIconManager.show', () => {
        iconPanel.show();
    });
    
    // Refresh command
    const refreshCommand = vscode.commands.registerCommand('svgIconManager.refresh', () => {
        iconPanel.refresh();
    });
    
    context.subscriptions.push(
        showPanelCommand,
        refreshCommand
    );
}

export function deactivate() {}