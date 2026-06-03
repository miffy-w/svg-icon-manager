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
      const size = await this.getImageSize();

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
  private async getImageSize(): Promise<{ width: number; height: number }> {
    // TODO: 可集成 image-size 库获取实际尺寸
    // 当前返回默认尺寸
    return { width: 0, height: 0 };
  }
}