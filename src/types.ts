/**
 * SVG Icon type definition
 */
export interface SvgIcon {
  name: string;
  path: string;
  relativePath: string;
  size: { width: number; height: number };
  content: string;
}

/**
 * Webview message types
 */
export type WebviewCommand =
  | "search"
  | "filterByPath"
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
