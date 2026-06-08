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

  /** 获取当前工作区根目录（动态读取） */
  private getWorkspaceRoot(): string | undefined {
    return this.workspaceRoot || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
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

    const root = this.getWorkspaceRoot();
    this.panel = vscode.window.createWebviewPanel(
      "svgIconManager",
      "SVG Icon Manager",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: root
          ? [vscode.Uri.file(root)]
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
    this.applyFilters(true); // skipUpdate: updateFull() 会重建整个页面
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

  private applyFilters(skipUpdate: boolean = false): void {
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
    if (!skipUpdate) {
      this.updateIcons();
    }
  }

  private getWebviewUri(filePath: string): vscode.Uri | undefined {
    if (!this.panel || !this.getWorkspaceRoot()) {
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

  private async copyImport(relativePath: string, name: string): Promise<void> {
    // 保留合法 JS 标识符字符，用 _ 替换非法字符
    let sanitizedName = name.replace(/[^a-zA-Z0-9_$]/g, "_");
    // 不能以数字开头
    if (/^\d/.test(sanitizedName)) {
      sanitizedName = "_" + sanitizedName;
    }
    // 空字符串回退
    if (!sanitizedName) {
      sanitizedName = "Asset";
    }
    // 确保路径以 ./ 开头
    const normalizedPath = relativePath.startsWith(".") ? relativePath : "./" + relativePath;
    const importCode = `import ${sanitizedName} from '${normalizedPath}';`;
    await vscode.env.clipboard.writeText(importCode);
    vscode.window.showInformationMessage("Import code copied to clipboard!");
  }

  private async openFile(filePath: string): Promise<void> {
    const uri = vscode.Uri.file(filePath);
    // 使用 vscode.open 而非 showTextDocument，兼容二进制图片文件
    await vscode.commands.executeCommand("vscode.open", uri);
  }
}