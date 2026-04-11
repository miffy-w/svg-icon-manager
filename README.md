# SVG Icon Manager

![GitHub release](https://img.shields.io/github/v/release/miffy-w/svg-icon-manager?style=flat-square)
![License](https://img.shields.io/github/license/miffy-w/svg-icon-manager?style=flat-square)
![GitHub stars](https://img.shields.io/github/stars/miffy-w/svg-icon-manager?style=flat-square)

A beautiful and efficient VS Code extension for managing SVG icons in your workspace. Scan, preview, search, and organize all your SVG icons with an intuitive card-based gallery interface.

## ✨ Features

- **🔍 Smart Scanning**: Automatically scans your workspace for SVG files
- **🎨 Beautiful Gallery**: Card-based icon preview with hover effects
- **🔎 Powerful Search**: Search icons by name or file path
- **📁 Path Filtering**: Filter icons by directory to quickly find what you need
- **📋 Quick Actions**:
  - Copy file path to clipboard
  - Copy import code instantly
  - Open SVG file in editor
- **📊 Icon Information**: Displays icon name, path, and dimensions
- **⚡ Fast Performance**: Optimized scanning and rendering
- **🌙 Dark Mode Support**: Seamlessly adapts to VS Code themes

## 🚀 Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Ctrl+Shift+X` (Mac: `Cmd+Shift+X`) to open Extensions
3. Search for "SVG Icon Manager"
4. Click Install

### Manual Installation

1. Download the latest `.vsix` file from the [Releases](https://github.com/miffy-w/svg-icon-manager/releases) page
2. Open VS Code
3. Press `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)
4. Type "Extensions: Install from VSIX..."
5. Select the downloaded file

## 📖 Usage

### Opening the Extension

- **Keyboard Shortcut**: Press `Ctrl+Alt+S` (Mac: `Cmd+Alt+S`)
- **Command Palette**: Press `Ctrl+Shift+P`, type "SVG Icon Manager"

### Features

#### Searching Icons

Use the search box to filter icons by name or file path. The search is case-insensitive and updates in real-time.

#### Filtering by Directory

Select a specific directory from the dropdown to view only icons in that location. This is useful when working with large projects.

#### Icon Actions

Each icon card has quick action buttons (visible on hover):

- **Copy Name** (`📋`): Copies the icon name to clipboard
- **Copy Import** (`📄`): Copies a ready-to-use import statement
- **Open File** (`✅`): Opens the SVG file in the editor

#### Refreshing

Click the "Refresh" button to rescan your workspace for new or modified SVG files.

## ⚙️ Configuration

You can customize the extension behavior through VS Code settings:

| Setting                         | Type   | Default                                                        | Description                                |
| ------------------------------- | ------ | -------------------------------------------------------------- | ------------------------------------------ |
| `svgIconManager.ignorePatterns` | array  | `["node_modules", ".git", "out", "dist", "build", "coverage"]` | Directory patterns to ignore when scanning |
| `svgIconManager.iconSize`       | number | `80`                                                           | Size of icon preview in pixels (48-128)    |

### Example Configuration

```json
{
  "svgIconManager.ignorePatterns": [
    "node_modules",
    ".git",
    "out",
    "dist",
    "build",
    "coverage",
    ".next",
    ".nuxt"
  ],
  "svgIconManager.iconSize": 96
}
```

## 🛠️ Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- VS Code

### Building

```bash
# Clone the repository
git clone https://github.com/miffy-w/svg-icon-manager.git
cd svg-icon-manager

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run in development mode
# Open the project in VS Code and press F5
```

### Publishing

```bash
# Package the extension
npm run package

# Publish to VS Code Marketplace
npm run publish
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [VS Code Extension API](https://code.visualstudio.com/api)
- Inspired by various icon management tools

## 📧 Support

- 🐛 [Report a bug](https://github.com/miffy-w/svg-icon-manager/issues)
- 💡 [Request a feature](https://github.com/miffy-w/svg-icon-manager/issues)
- 💬 [Discussions](https://github.com/miffy-w/svg-icon-manager/discussions)

## 🔗 Links

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=miffy-w.svg-icon-manager)
- [GitHub Repository](https://github.com/miffy-w/svg-icon-manager)
- [Changelog](CHANGELOG.md)

---

Made with ❤️ by [miffy-w](https://github.com/miffy-w)
