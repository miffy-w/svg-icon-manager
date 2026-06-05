# Image Asset Manager

![GitHub release](https://img.shields.io/github/v/release/miffy-w/svg-icon-manager?style=flat-square)
![License](https://img.shields.io/github/license/miffy-w/svg-icon-manager?style=flat-square)
![GitHub stars](https://img.shields.io/github/stars/miffy-w/svg-icon-manager?style=flat-square)

A beautiful and efficient VS Code extension for managing image assets in your workspace. Scan, preview, search, and organize all your image assets (SVG, PNG, JPG, WebP, GIF, ICO, BMP) with an intuitive card-based gallery interface.

## ✨ Features

- **🖼️ Multi-Format Support**: Scans SVG, PNG, JPG, WebP, GIF, ICO, and BMP files
- **🔍 Smart Scanning**: Automatically discovers all image assets in your workspace
- **🎨 Beautiful Gallery**: Card-based preview with hover effects and zoom overlay for images
- **🔎 Powerful Search**: Search assets by name or file path with real-time filtering
- **🏷️ Format Filter**: Toggle individual image formats with clickable chip buttons
- **📁 Path Filtering**: Filter assets by directory to quickly find what you need
- **🖼️ Image Preview Modal**: Click any image card to open a full-size preview with file details
- **📋 Quick Actions**:
  - Copy asset name to clipboard
  - Copy import code with proper relative path
  - Open file in editor
- **📊 Asset Information**: Displays file name, path, dimensions, and file size
- **⚡ Fast Performance**: Optimized scanning with incremental grid updates
- **🌙 Dark Mode Support**: Seamlessly adapts to VS Code themes using CSS variables

## 🚀 Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Ctrl+Shift+X` (Mac: `Cmd+Shift+X`) to open Extensions
3. Search for "Image Asset Manager"
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
- **Command Palette**: Press `Ctrl+Shift+P`, type "Image Asset Manager"

### Features

#### Searching Assets

Use the search box to filter assets by name or file path. The search is case-insensitive and updates in real-time as you type.

#### Filtering by Format

Click the format chips (SVG, PNG, JPG, etc.) to toggle which image formats are displayed. The view updates immediately on each click.

#### Filtering by Directory

Select a specific directory from the dropdown to view only assets in that location. This is useful when working with large projects.

#### Previewing Images

Click any non-SVG image card to open a full-size preview modal. The modal shows the full filename (with extension) and file size. Press `Escape`, click the backdrop, or click the ✕ button to close.

#### Asset Actions

Each card has quick action buttons (visible on hover):

- **Copy Name**: Copies the asset name to clipboard
- **Copy Import**: Copies a ready-to-use import statement with relative path
- **Open File**: Opens the asset file in the editor

## ⚙️ Configuration

You can customize the extension behavior through VS Code settings:

| Setting                         | Type   | Default                                                        | Description                                               |
| ------------------------------- | ------ | -------------------------------------------------------------- | --------------------------------------------------------- |
| `svgIconManager.ignorePatterns` | array  | `["node_modules", ".git", "out", "dist", "build", "coverage"]` | Directory patterns to ignore (supports glob like `**/test/**`) |
| `svgIconManager.iconSize`       | number | `80`                                                           | Size of asset preview in pixels (48-128)                  |

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
    ".nuxt",
    "**/test/**"
  ],
  "svgIconManager.iconSize": 96
}
```

## 🛠️ Development

### Prerequisites

- Node.js 18 or higher
- npm
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
- Image dimension detection via [image-size](https://github.com/image-size/image-size)
- Glob matching via [minimatch](https://github.com/isaacs/minimatch)

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
