# AI Agents Guide - SVG Icon Manager

> 本文件为 AI 代理（如 Claude、GPT-4、GitHub Copilot 等）提供项目上下文，帮助快速理解和迭代开发。

## 项目概述

**SVG Icon Manager** 是一个 VS Code 扩展，用于扫描、预览和管理工程中的所有 SVG 图标。提供卡片式图库界面、搜索过滤、快速操作等功能。

- **仓库**: https://github.com/miffy-w/svg-icon-manager
- **发布者**: miffy-w
- **许可证**: MIT

## 技术栈

| 类型 | 技术 |
|------|------|
| 语言 | TypeScript 5.x |
| 运行时 | Node.js 18+ |
| 目标平台 | VS Code 1.74+ |
| 构建工具 | tsc (TypeScript Compiler) |
| 代码检查 | ESLint |
| 打包工具 | @vscode/vsce |

## 项目结构

```
svg-icon-manager/
├── src/
│   ├── extension.ts          # 扩展入口，注册命令和激活逻辑
│   ├── scanner.ts            # IconScanner 类，扫描工作区 SVG 文件
│   ├── types.ts              # 类型定义 (SvgIcon, WebviewMessage 等)
│   └── webview/
│       ├── index.ts          # IconPanel 类，管理 WebView 面板
│       ├── scripts.ts        # WebView 前端脚本
│       ├── styles.ts         # WebView CSS 样式
│       └── templates.ts      # HTML 模板渲染
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

### 2. scanner.ts (SVG 扫描器)

**IconScanner 类**:
- `scan()`: 扫描工作区，返回 `SvgIcon[]`
- `findSvgFiles()`: 递归查找 SVG 文件，支持忽略模式
- `parseSvgFile()`: 解析单个 SVG，提取元数据
- `extractSvgSize()`: 从 SVG 内容提取尺寸

### 3. types.ts (类型定义)

```typescript
interface SvgIcon {
  name: string;           // 图标名称（不含扩展名）
  path: string;           // 绝对路径
  relativePath: string;   // 相对于工作区的路径
  size: { width: number; height: number };
  content: string;        // SVG 文件内容
}

type WebviewCommand = 'search' | 'filterByPath' | 'copyName' | 'copyImport' | 'openFile' | 'refresh' | 'updateIcons';
```

### 4. webview/index.ts (面板管理)

**IconPanel 类**:
- `show()`: 显示或创建 WebView 面板
- `refresh()`: 重新扫描图标
- `applyFilters()`: 应用搜索和目录过滤
- 消息处理: search, filterByPath, copyName, copyImport, openFile, refresh

## VS Code 扩展 API 使用

- `vscode.commands.registerCommand()` - 注册命令
- `vscode.window.createWebviewPanel()` - 创建 WebView
- `vscode.workspace.getConfiguration()` - 读取配置
- `vscode.env.clipboard.writeText()` - 写入剪贴板
- `vscode.window.showTextDocument()` - 打开文件

## 配置项

| 配置键 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `svgIconManager.ignorePatterns` | string[] | `["node_modules", ".git", "out", "dist", "build", "coverage"]` | 扫描时忽略的目录 |
| `svgIconManager.iconSize` | number | 80 | 图标预览尺寸 (48-128px) |

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
3. 在 `webview/scripts.ts` 中添加前端发送消息的函数
4. 在 `webview/templates.ts` 中更新 HTML 模板（如需要）

### 添加新的配置项

1. 在 `package.json` 的 `contributes.configuration.properties` 中定义
2. 在相关模块中通过 `vscode.workspace.getConfiguration()` 读取

### 修改 WebView 样式

- 编辑 `webview/styles.ts` 中的 `getStyles()` 函数
- 样式以字符串形式注入到 HTML 中

### 添加新的图标操作

1. 在 `types.ts` 添加命令类型
2. 在 `webview/index.ts` 实现后端逻辑
3. 在 `webview/scripts.ts` 添加前端调用
4. 在 `webview/templates.ts` 添加 UI 按钮

## 注意事项

- WebView 中的脚本运行在隔离环境，通过 `postMessage` 与扩展通信
- 修改 TypeScript 源码后需重新编译 (`npm run compile`)
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
