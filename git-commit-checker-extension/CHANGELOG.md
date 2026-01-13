# Changelog

All notable changes to the "Git Commit Checker" extension will be documented in this file.

📦 **GitHub 仓库**: [https://github.com/maxiaosong1124/git-commit-checker](https://github.com/maxiaosong1124/git-commit-checker)

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2] - 2026-01-13

### Added
- 🤖 **AI 智能描述生成** - 使用 OpenAI 格式 API 自动生成提交描述
  - 支持自定义 API 端点（兼容 OpenAI、本地 LLM 等）
  - 智能 Prompt 设计，根据代码差异分析生成规范的 commit 信息
  - 支持用户编辑 AI 生成的建议
  - 优雅的错误处理和回退机制
- ⚙️ AI 配置项：`ai.enabled`, `ai.apiKey`, `ai.endpoint`, `ai.model`, `ai.timeout`, `ai.maxDiffLength`
- ✅ 新增 17 个 AI 服务单元测试

### Changed
- 提交流程新增提交方式选择：AI 智能生成 / 智能建议 / 手动输入

---

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
