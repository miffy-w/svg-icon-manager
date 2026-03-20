import * as vscode from "vscode";
import * as path from "path";
import { SvgIcon, WebviewMessage } from "../types";
import { IconScanner } from "../scanner";
import { getStyles } from "./styles";
import { getScripts } from "./scripts";
import {
  renderIconCards,
  renderDirectoryOptions,
  renderStats,
  getWebviewHtml,
} from "./templates";

/**
 * IconPanel - Manages the webview panel for displaying SVG icons
 */
export class IconPanel {
  private panel: vscode.WebviewPanel | undefined;
  private icons: SvgIcon[] = [];
  private filteredIcons: SvgIcon[] = [];
  private directories: string[] = [];
  private selectedDirectory: string = "";
  private searchQuery: string = "";
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
        localResourceRoots: [],
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
    this.icons = await this.scanner.scan();
    this.directories = this.extractDirectories(this.icons);
    this.filteredIcons = [...this.icons];
    this.updateFull();
  }

  private extractDirectories(icons: SvgIcon[]): string[] {
    const dirSet = new Set<string>();
    icons.forEach((icon) => {
      const dir = path.dirname(icon.relativePath);
      if (dir !== ".") {
        dirSet.add(dir);
      }
    });
    return Array.from(dirSet).sort();
  }

  private applyFilters(): void {
    let result = [...this.icons];

    // Apply directory filter
    if (this.selectedDirectory) {
      result = result.filter((icon) => {
        const dir = path.dirname(icon.relativePath);
        return dir === this.selectedDirectory;
      });
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const lowerQuery = this.searchQuery.toLowerCase();
      result = result.filter(
        (icon) =>
          icon.name.toLowerCase().includes(lowerQuery) ||
          icon.relativePath.toLowerCase().includes(lowerQuery),
      );
    }

    this.filteredIcons = result;
    this.updateIcons();
  }

  private updateIcons(): void {
    if (!this.panel) {
      return;
    }

    const cardsHtml = renderIconCards(this.filteredIcons);

    this.panel.webview.postMessage({
      command: "updateIcons",
      icons: cardsHtml,
      count: this.filteredIcons.length,
      total: this.icons.length,
    });
  }

  private updateFull(): void {
    if (!this.panel) {
      return;
    }

    const styles = getStyles(this.iconSize);
    const scripts = getScripts();
    const cardsHtml = renderIconCards(this.filteredIcons);
    const directoriesOptions = renderDirectoryOptions(
      this.directories,
      this.selectedDirectory,
    );
    const statsText = renderStats(this.filteredIcons.length, this.icons.length);

    this.panel.webview.html = getWebviewHtml(
      styles,
      scripts,
      this.searchQuery,
      directoriesOptions,
      cardsHtml,
      statsText,
    );
  }

  private async copyName(name: string): Promise<void> {
    await vscode.env.clipboard.writeText(name);
    vscode.window.showInformationMessage("Icon name copied to clipboard!");
  }

  private async copyImport(filePath: string, name: string): Promise<void> {
    const importCode = `import ${name.replace(/[^a-zA-Z0-9]/g, "")} from '${filePath}';`;
    await vscode.env.clipboard.writeText(importCode);
    vscode.window.showInformationMessage("Import code copied to clipboard!");
  }

  private async openFile(filePath: string): Promise<void> {
    const uri = vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(uri);
  }
}
