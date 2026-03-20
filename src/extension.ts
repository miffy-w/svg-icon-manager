import * as vscode from "vscode";
import { IconScanner } from "./scanner";
import { IconPanel } from "./webview";

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log("SVG Icon Manager is now active!");

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const scanner = new IconScanner(workspaceRoot);
  const iconPanel = new IconPanel(context, workspaceRoot, scanner);

  // Show panel command
  const showPanelCommand = vscode.commands.registerCommand(
    "svgIconManager.show",
    () => {
      iconPanel.show();
    },
  );

  // Refresh command
  const refreshCommand = vscode.commands.registerCommand(
    "svgIconManager.refresh",
    () => {
      iconPanel.refresh();
    },
  );

  context.subscriptions.push(showPanelCommand, refreshCommand);
}

/**
 * Extension deactivation
 */
export function deactivate(): void {
  // Cleanup if needed
}