# Changelog

All notable changes to the "Git Commit Checker" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-01-12

### Added
- 🎉 Initial release
- ✨ 5-step interactive commit flow (type → scope → subject → body → footer)
- 🔍 Automatic staged files detection
- ✅ Commit message validation based on Conventional Commits
- ⚙️ Customizable configuration via VSCode settings
- 📁 Project-level configuration file support (`.commitcheckerrc.json`)
- ⌨️ Keyboard shortcut `Ctrl+Shift+G C` / `Cmd+Shift+G C`
- 📊 Staged files diff preview

### Supported Commit Types
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation updates
- `style` - Code style changes
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Test related changes
- `build` - Build system changes
- `ci` - CI configuration changes
- `chore` - Other changes
- `revert` - Revert commits
