# AI Agents Guide - SVG Icon Manager

> 本文件为 AI 代理（如 Claude、GPT-4、GitHub Copilot 等）提供项目上下文，帮助快速理解和迭代开发。

## 项目概述

**SVG Icon Manager** 是一个 VS Code 扩展，用于扫描、预览和管理工程中的所有 SVG 图标。提供卡片式图库界面、搜索过滤、快速操作等功能。

- **仓库**: https://github.com/miffy-w/svg-icon-manager
- **发布者**: miffy-w
- **许可证**: MIT

## 技术栈

| 类型     | 技术                      |
| -------- | ------------------------- |
| 语言     | TypeScript 5.x            |
| 运行时   | Node.js 18+               |
| 目标平台 | VS Code 1.74+             |
| 构建工具 | tsc (TypeScript Compiler) |
| 代码检查 | ESLint                    |
| 打包工具 | @vscode/vsce              |

## 项目结构

```
svg-icon-manager/
├── src/
│   ├── extension.ts          # 扩展入口，注册命令和激活逻辑
│   ├── scanner.ts            # IconScanner 类，扫描工作区图片资源
│   ├── types.ts              # 类型定义 (ImageAsset, WebviewMessage 等)
│   └── webview/
│       ├── index.ts          # IconPanel 类，管理 WebView 面板
│       └── templates.ts      # HTML 模板渲染
├── media/
│   ├── webview.css           # WebView 样式（运行时由 fs 读取后内联）
│   └── webview.js            # WebView 前端脚本（运行时由 fs 读取后内联）
├── resources/
│   ├── icon.png              # 扩展图标
│   └── icon.svg              # 扩展图标 SVG 源文件
├── out/                      # 编译输出目录
├── package.json              # 扩展配置和依赖
├── tsconfig.json             # TypeScript 配置
└── .eslintrc.json            # ESLint 配置
```

## 核心模块说明

### 1. extension.ts (扩展入口)

- `activate()`: 注册命令 `svgIconManager.show` 和 `svgIconManager.refresh`
- `deactivate()`: 清理资源（目前为空）

### 2. scanner.ts (图片扫描器)

**IconScanner 类**:

- `scan(formats?)`: 扫描工作区（可按格式过滤），分批解析，返回 `ImageAsset[]`
- `findImageFiles()`: 递归查找图片文件，支持忽略模式（含 glob）
- `parseImageFile()`: 解析单个图片，提取尺寸/大小等元数据
- `extractSvgSize()`: 从 SVG 内容提取尺寸
- `sanitizeSvg()`: 清理 SVG 中的脚本/事件属性，防止 XSS
- `getImageSize()`: 优先只读文件头部获取非 SVG 图片尺寸

### 3. types.ts (类型定义)

```typescript
interface ImageAsset {
  name: string; // 文件名（不含扩展名）
  path: string; // 绝对路径
  relativePath: string; // 相对于工作区的路径
  format: ImageFormat; // svg | png | jpg | jpeg | webp | gif | ico | bmp
  size: { width: number; height: number };
  fileSize?: number; // 文件大小（字节）
  content?: string; // SVG 内联内容（仅 SVG 有）
}

type WebviewCommand =
  | "search"
  | "filterByPath"
  | "filterByFormat"
  | "copyName"
  | "copyImport"
  | "openFile"
  | "refresh"
  | "applyFilter";
```

### 4. webview/index.ts (面板管理)

**IconPanel 类**:

- `show()`: 显示或创建 WebView 面板
- `refresh()`: 重新扫描资源并全量渲染页面
- `applyFilters()`: 应用搜索、目录（前缀匹配含子目录）过滤，通过 `applyFilter` 消息推送可见列表，前端只切换卡片显隐
- 消息处理: search, filterByPath, filterByFormat, copyName, copyImport, openFile, refresh

## VS Code 扩展 API 使用

- `vscode.commands.registerCommand()` - 注册命令
- `vscode.window.createWebviewPanel()` - 创建 WebView
- `vscode.workspace.getConfiguration()` - 读取配置
- `vscode.env.clipboard.writeText()` - 写入剪贴板
- `vscode.window.showTextDocument()` - 打开文件

## 配置项

| 配置键                          | 类型     | 默认值                                                         | 说明                    |
| ------------------------------- | -------- | -------------------------------------------------------------- | ----------------------- |
| `svgIconManager.ignorePatterns` | string[] | `["node_modules", ".git", "out", "dist", "build", "coverage"]` | 扫描时忽略的目录        |
| `svgIconManager.iconSize`       | number   | 80                                                             | 图标预览尺寸 (48-128px) |

## 开发命令

```bash
npm run compile    # 编译 TypeScript
npm run watch      # 监听模式编译
npm run lint       # ESLint 检查
npm run package    # 打包为 .vsix
npm run publish    # 发布到 VS Code Marketplace
```

## 开发环境设置

1. 克隆仓库并安装依赖: `npm install`
2. 在 VS Code 中打开项目
3. 按 F5 启动扩展开发主机
4. 在开发主机中测试扩展功能

## 代码规范

- 使用 TypeScript 严格模式 (`strict: true`)
- 使用 ESLint 进行代码检查
- 遵循 VS Code 扩展 API 最佳实践
- WebView 内容通过模板函数生成，避免 XSS

## 常见开发任务

### 添加新的 WebView 消息类型

1. 在 `types.ts` 的 `WebviewCommand` 类型中添加新命令
2. 在 `webview/index.ts` 的消息处理器中添加 case
3. 在 `media/webview.js` 中添加前端发送消息的函数
4. 在 `webview/templates.ts` 中更新 HTML 模板（如需要）

### 添加新的配置项

1. 在 `package.json` 的 `contributes.configuration.properties` 中定义
2. 在相关模块中通过 `vscode.workspace.getConfiguration()` 读取

### 修改 WebView 样式

- 编辑 `media/webview.css`（真实 CSS 文件，无需重新编译，刷新面板即可生效）
- 图标尺寸等动态值通过 CSS 变量（如 `--icon-size`）由 `webview/index.ts` 注入

### 添加新的图标操作

1. 在 `types.ts` 添加命令类型
2. 在 `webview/index.ts` 实现后端逻辑
3. 在 `media/webview.js` 添加前端调用
4. 在 `webview/templates.ts` 添加 UI 按钮

## 注意事项

- WebView 中的脚本运行在隔离环境，通过 `postMessage` 与扩展通信
- 修改 TypeScript 源码后需重新编译 (`npm run compile`)；修改 `media/` 下的 CSS/JS 无需编译，刷新面板即可
- 发布前确保更新 `CHANGELOG.md` 和 `package.json` 版本号
- 所有文件路径使用绝对路径或正确处理跨平台路径分隔符

## 测试

目前项目无自动化测试。开发时通过以下方式验证：

1. 按 F5 启动扩展开发主机
2. 打开包含 SVG 文件的工程
3. 使用 `Ctrl+Shift+I` 打开 SVG Icon Manager
4. 验证扫描、搜索、过滤、复制等功能

## 相关文档

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
