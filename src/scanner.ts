import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { SvgIcon } from "./types";

/**
 * IconScanner - Scans workspace for SVG icons
 */
export class IconScanner {
  private icons: SvgIcon[] = [];
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

  private async findSvgFiles(
    dir: string,
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
          const subFiles = await this.findSvgFiles(
            fullPath,
            depth + 1,
            maxDepth,
          );
          files.push(...subFiles);
        } else if (entry.name.toLowerCase().endsWith(".svg")) {
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
      const content = await fs.promises.readFile(filePath, "utf-8");
      const relativePath = path.relative(this.workspaceRoot!, filePath);
      const name = path.basename(filePath, ".svg");

      const size = this.extractSvgSize(content);

      return {
        name,
        path: filePath,
        relativePath: relativePath.replace(/\\/g, "/"),
        size,
        content,
      };
    } catch (error) {
      console.error(`Error parsing SVG file ${filePath}:`, error);
      return null;
    }
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
}
