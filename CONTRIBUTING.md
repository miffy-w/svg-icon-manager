# Contributing to SVG Icon Manager

Thank you for your interest in contributing to SVG Icon Manager! This document provides guidelines and instructions for contributing to this project.

## 🤝 How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find that the problem has already been reported.

When creating a bug report, please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots or screen recordings if applicable
- Your operating system and VS Code version
- Extension version

### Suggesting Enhancements

Enhancement suggestions are also welcome! Please include:

- A clear and descriptive title
- A detailed description of the enhancement
- Explain why this enhancement would be useful
- Provide examples or mockups if applicable

## 🛠️ Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- VS Code

### Setting Up Development Environment

1. **Fork and Clone the Repository**

   ```bash
   git clone https://github.com/your-username/svg-icon-manager.git
   cd svg-icon-manager
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Compile TypeScript**

   ```bash
   npm run compile
   ```

4. **Run in Development Mode**

   - Open the project in VS Code
   - Press `F5` to launch the Extension Development Host
   - A new VS Code window will open with the extension loaded

### Project Structure

```
svg-icon-manager/
├── .github/           # GitHub Actions workflows
├── resources/         # Extension resources (icons, images)
├── src/               # Source code
│   └── extension.ts  # Main extension file
├── .vscode/           # VS Code configuration
├── out/               # Compiled JavaScript (generated)
├── package.json       # Extension manifest
├── tsconfig.json      # TypeScript configuration
└── README.md         # Project documentation
```

### Code Style

- Use TypeScript for all new code
- Follow the existing code style and conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Testing

Before submitting a PR, please:

1. Test your changes thoroughly
2. Ensure the extension compiles without errors
3. Test in both light and dark themes
4. Test on different screen sizes

## 📝 Submitting Changes

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for code style changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

Example:
```
git commit -m "feat: add icon color filtering"
```

### Pull Request Process

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them with clear messages

3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request:
   - Provide a clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure all CI checks pass

### PR Review Process

- Maintainers will review your PR
- Address any feedback or requested changes
- Once approved, your PR will be merged

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 💬 Getting Help

If you need help:

- Check the [Documentation](README.md)
- Search [existing issues](https://github.com/your-username/svg-icon-manager/issues)
- Start a [discussion](https://github.com/your-username/svg-icon-manager/discussions)
- Ask a question in your PR

## 🙏 Thank You

Thank you for taking the time to contribute to SVG Icon Manager! Your contributions help make this extension better for everyone.