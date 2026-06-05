# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2026-06-05

### Fixed
- Extension commands and shortcuts not working due to missing runtime dependencies in VSIX package (`minimatch`, `image-size` excluded by `.vscodeignore`)

## [1.2.0] - 2026-06-05

### Added
- **Multi-format image support**: scan and preview PNG, JPG, WebP, GIF, ICO, BMP in addition to SVG
- **Image preview modal**: click any non-SVG card to open a full-size preview with zoom overlay
- **Format filter chips**: toggle image formats with instant checkbox-style chips, replacing the old dropdown
- **File size display**: cards and preview modal now show human-readable file sizes
- **Real image dimensions**: non-SVG images now display actual pixel dimensions via `image-size` library
- **Refresh button spin animation**: visual feedback when rescanning the workspace
- **Glob pattern support**: `ignorePatterns` config now accepts glob patterns (e.g. `**/test/**`) via `minimatch`

### Changed
- **Renamed to "Image Asset Manager"** to reflect multi-format support
- Format filter now uses clickable chips with instant filtering — no Apply button needed
- Header layout uses flex-wrap for adaptive single/double row on narrow viewports
- Modal header shows filename (with extension) and file size on the left, close button on the right
- Card meta line shows dimensions + file size (e.g. `120×80 · 2.3 KB`)
- Copy Import now generates relative paths with proper JS identifier sanitization

### Fixed
- **XSS prevention**: SVG content is sanitized to strip scripts, event handlers, and foreignObject elements
- **SVG viewBox parsing**: now supports comma-separated and negative values
- **Workspace root**: dynamically re-reads on scan instead of caching at activation, supporting workspace switching
- **Box-shadow**: uses VS Code CSS variables to adapt to dark/light themes
- **Refresh race condition**: eliminated stale partial-update message during full page rebuild

### Security
- SVG content sanitization to prevent script injection via malicious SVG files

---

## [1.1.0] - 2026-05-20

### Changed
- Refactored codebase with improved architecture and component separation
- Updated keyboard shortcut to `Ctrl+Alt+S` (Mac: `Cmd+Alt+S`)
- Improved search filter behavior (preserves filter state on refresh)

### Fixed
- Various UI and performance improvements

---

## [1.0.0] - 2026-03-17

### Added
- Initial release
- SVG file scanning and parsing
- Card-based icon gallery interface
- Real-time search functionality
- Directory filtering
- Copy file path to clipboard
- Copy import code to clipboard
- Open SVG file in editor
- Icon information display (name, path, dimensions)
- Keyboard shortcut support (`Ctrl+Alt+S`)
- Dark mode support
- Configuration options for ignore patterns and icon size
- Refresh functionality

### Features
- Smart workspace scanning
- Automatic SVG dimension detection
- Responsive grid layout
- Optimized performance with incremental updates
- Hover effects and smooth animations

[1.2.1]: https://github.com/miffy-w/svg-icon-manager/releases/tag/v1.2.1
[1.2.0]: https://github.com/miffy-w/svg-icon-manager/releases/tag/v1.2.0
[1.1.0]: https://github.com/miffy-w/svg-icon-manager/releases/tag/v1.1.0
[1.0.0]: https://github.com/miffy-w/svg-icon-manager/releases/tag/v1.0.0