/**
 * 支持的图片格式
 */
export type ImageFormat = 'svg' | 'png' | 'jpg' | 'jpeg' | 'webp' | 'gif' | 'ico' | 'bmp';

/**
 * 图片资源类型定义
 */
export interface ImageAsset {
  name: string;           // 文件名（不含扩展名）
  path: string;           // 绝对路径
  relativePath: string;   // 相对工作区的路径
  format: ImageFormat;    // 文件格式
  size: { width: number; height: number };
  fileSize?: number;      // 文件大小（字节）
  content?: string;       // SVG 内联内容（仅 SVG 有）
}

/**
 * Webview message types
 */
export type WebviewCommand =
  | "search"
  | "filterByPath"
  | "filterByFormat"
  | "copyName"
  | "copyImport"
  | "openFile"
  | "refresh"
  | "updateIcons";

export interface WebviewMessage {
  command: WebviewCommand;
  query?: string;
  path?: string;
  name?: string;
  formats?: ImageFormat[];
}

export interface UpdateIconsMessage {
  command: "updateIcons";
  icons: string;
  count: number;
  total: number;
}

/**
 * Configuration interface
 */
export interface SvgIconManagerConfig {
  ignorePatterns: string[];
  iconSize: number;
}