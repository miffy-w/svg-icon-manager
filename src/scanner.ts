import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { minimatch } from "minimatch";
import { imageSize } from "image-size";
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

  constructor(private workspaceRoot?: string) {
    this.loadConfig();
  }

  /**
   * 获取当前工作区根目录（动态读取，支持工作区切换）
   */
  private getWorkspaceRoot(): string | undefined {
    // 优先用传入的，回退到 VS Code API
    return this.workspaceRoot || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
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

    const workspaceRoot = this.getWorkspaceRoot();
    if (!workspaceRoot) {
      return this.assets;
    }

    const targetFormats = formats || SUPPORTED_FORMATS;
    const files = await this.findImageFiles(workspaceRoot, targetFormats);

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

  /**
   * 检查给定路径是否匹配任一忽略模式
   */
  private shouldIgnore(relativePath: string, entryName: string): boolean {
    return this.ignorePatterns.some(pattern => {
      // 精确目录名匹配（向后兼容）
      if (pattern === entryName) {
        return true;
      }
      // glob 模式匹配（如 **/test/**、*.generated.*）
      return minimatch(relativePath, pattern, { dot: true, matchBase: true });
    });
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
        const relPath = path.relative(this.getWorkspaceRoot()!, fullPath).replace(/\\/g, "/");

        if (this.shouldIgnore(relPath, entry.name)) {
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

      const relativePath = path.relative(this.getWorkspaceRoot()!, filePath);
      const name = path.basename(filePath, ext);
      const stat = await fs.promises.stat(filePath);

      // SVG 特殊处理：读取内容用于内联渲染（需清洗防止 XSS）
      if (format === 'svg') {
        const rawContent = await fs.promises.readFile(filePath, 'utf-8');
        const content = this.sanitizeSvg(rawContent);
        const size = this.extractSvgSize(rawContent);

        return {
          name,
          path: filePath,
          relativePath: relativePath.replace(/\\/g, "/"),
          format,
          size,
          fileSize: stat.size,
          content,
        };
      }

      // 其他图片格式：读取文件头获取实际尺寸
      const size = await this.getImageSize(filePath);

      return {
        name,
        path: filePath,
        relativePath: relativePath.replace(/\\/g, "/"),
        format,
        size,
        fileSize: stat.size,
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
      /viewBox=["']\s*(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)\s*["']/i,
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
   * 清除 SVG 中的危险内容（XSS 防护）
   * 移除 script 标签、事件处理器、foreignObject 等
   */
  private sanitizeSvg(content: string): string {
    // 移除 <script> 元素及其内容
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // 移除事件处理器属性 (onclick, onload, onerror 等)
    content = content.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '');
    content = content.replace(/\s+on\w+\s*=\s*'[^']*'/gi, '');
    content = content.replace(/\s+on\w+\s*=\s*[^\s>/]+/gi, '');
    // 移除 <foreignObject> 元素（可嵌入 HTML/JS）
    content = content.replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '');
    return content;
  }

  /**
   * 获取图片尺寸（通过读取文件头）
   * 使用 image-size 库，支持 PNG/JPG/WebP/GIF/ICO/BMP 等格式
   */
  private async getImageSize(filePath: string): Promise<{ width: number; height: number }> {
    try {
      const buffer = await fs.promises.readFile(filePath);
      const dimensions = imageSize(buffer as unknown as Uint8Array);
      if (dimensions && dimensions.width && dimensions.height) {
        return { width: dimensions.width, height: dimensions.height };
      }
    } catch {
      // 读取失败时返回默认值
    }
    return { width: 0, height: 0 };
  }
}