# GitHub Copilot Instructions

此文件为 GitHub Copilot 提供项目特定的编码指南和上下文。

## 项目背景

这是一个 VS Code 扩展，用于管理和预览工作区中的 SVG 图标。使用 TypeScript 开发。

## 编码规范

### TypeScript

- 使用严格模式，避免 `any` 类型
- 优先使用接口定义数据结构
- 使用 async/await 处理异步操作

### VS Code API

- 命令 ID 格式: `svgIconManager.<action>`
- 配置命名空间: `svgIconManager`
- 使用 `vscode` 模块的类型定义

### WebView

- HTML/CSS/JS 通过模板函数生成
- 避免内联事件处理，使用 `postMessage` 通信
- 样式需适配 VS Code 主题（支持深色模式）

## 文件组织

- `src/extension.ts` - 扩展入口
- `src/scanner.ts` - SVG 扫描逻辑
- `src/types.ts` - 类型定义
- `src/webview/` - WebView 相关代码

## 提交规范

使用语义化提交消息:

- `feat:` 新功能
- `fix:` 修复 bug
- `refactor:` 代码重构
- `docs:` 文档更新
- `chore:` 构建/工具变更
