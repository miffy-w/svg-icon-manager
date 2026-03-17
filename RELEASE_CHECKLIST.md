# Release Checklist

Use this checklist to ensure everything is ready before publishing the extension to the VS Code Marketplace.

## Pre-Release Checklist

### 1. Code Quality
- [ ] All TypeScript errors are fixed
- [ ] Code compiles successfully (`npm run compile`)
- [ ] No console errors or warnings
- [ ] All features work as expected
- [ ] Tested in both light and dark themes
- [ ] Tested on different screen sizes

### 2. Documentation
- [ ] README.md is complete and accurate
- [ ] CHANGELOG.md is updated with new features
- [ ] LICENSE file is included
- [ ] CONTRIBUTING.md is available
- [ ] All placeholder text is replaced (publisher name, author, etc.)

### 3. Configuration
- [ ] package.json is properly configured
  - [ ] Publisher name is set
  - [ ] Version number is updated
  - [ ] Description is clear and concise
  - [ ] Icon is provided
  - [ ] Keywords are relevant
- [ ] .vscodeignore is properly configured
- [ ] .gitignore is properly configured

### 4. Testing
- [ ] Tested in development mode (F5)
- [ ] All keyboard shortcuts work
- [ ] Search functionality works correctly
- [ ] Path filtering works correctly
- [ ] Copy actions work correctly
- [ ] Refresh functionality works
- [ ] No memory leaks
- [ ] Performance is acceptable

### 5. Publishing Requirements
- [ ] VS Code Marketplace account created
- [ ] Publisher name registered
- [ ] Personal Access Token (PAT) generated
- [ ] vsce is installed (`npm install -g @vscode/vsce`)

## Publishing Steps

### 1. Update Version
```bash
# Update version in package.json
npm version patch  # or minor, major
```

### 2. Update CHANGELOG
```markdown
## [1.0.1] - 2026-03-17

### Fixed
- Fixed search box losing focus
- Fixed icon card height stretching
```

### 3. Commit Changes
```bash
git add .
git commit -m "chore: prepare for release v1.0.1"
git tag v1.0.1
git push origin main --tags
```

### 4. Package Extension
```bash
npm run package
```

### 5. Test Package
```bash
# Install the .vsix file in VS Code
# Test all features
```

### 6. Publish to Marketplace
```bash
# Using vsce
npm run publish

# Or manually
vsce publish
```

### 7. Create GitHub Release
```bash
# Go to GitHub releases page
# Create a new release from the tag
# Upload the .vsix file
# Add release notes from CHANGELOG
```

## Post-Release Checklist

- [ ] Verify extension appears in Marketplace
- [ ] Test installation from Marketplace
- [ ] Monitor issues and feedback
- [ ] Update documentation if needed
- [ ] Respond to user questions

## Common Issues

### Publisher Name Not Found
```
Error: Publisher 'your-name' not found
```
Solution: Register the publisher name at https://marketplace.visualstudio.com/manage

### Authentication Failed
```
Error: Invalid Personal Access Token
```
Solution: Generate a new PAT at https://marketplace.visualstudio.com/manage/publishers

### Package Size Too Large
```
Error: Extension size exceeds 100MB
```
Solution: Check .vscodeignore and exclude unnecessary files

## Resources

- [VS Code Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce Documentation](https://github.com/microsoft/vscode-vsce)
- [Marketplace Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)