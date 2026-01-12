# Git Commit Checker

[![VSCode](https://img.shields.io/badge/VSCode-007ACC?logo=visual-studio-code&logoColor=white)](https://code.visualstudio.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个 VSCode 插件，用于检查和规范 Git Commit 提交信息格式，确保团队代码提交规范的统一性。

## ✨ 功能特性

- 🔍 **自动检测代码差异** - 提交前自动获取暂存区的代码变更
- ✅ **Commit 信息格式校验** - 按照 Conventional Commits 规范验证提交信息
- 🎯 **智能提交引导** - 5步交互式界面引导用户填写规范的 commit 信息
- ⚙️ **自定义规则配置** - 支持项目级别的提交格式自定义

## 📦 安装

1. 打开 VSCode
2. 按 `Ctrl+P` 打开快速命令面板
3. 输入 `ext install git-commit-checker`
4. 点击安装

或者从源码安装：

```bash
cd git-commit-checker-extension
npm install
npm run compile
```

## 🚀 使用方法

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+G C` (Windows/Linux) | 开始规范化提交 |
| `Cmd+Shift+G C` (Mac) | 开始规范化提交 |

### 命令面板

按 `Ctrl+Shift+P` 打开命令面板，输入：

- `Git Commit Checker: 提交` - 开始规范化提交流程
- `Git Commit Checker: 查看差异` - 查看暂存区代码差异

### 提交流程

1. **选择提交类型** - 从预定义的类型列表中选择（feat、fix、docs 等）
2. **输入影响范围** - 可选，输入本次修改影响的模块
3. **输入简短描述** - 用一句话描述本次修改
4. **添加详细描述** - 可选，添加更详细的说明
5. **添加关联信息** - 可选，关联 Issue 或标记 Breaking Change

## 📋 Commit 信息格式

本插件遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 支持的类型

| Type | 说明 | Emoji |
|------|------|-------|
| `feat` | 新功能 | ✨ |
| `fix` | Bug 修复 | 🐛 |
| `docs` | 文档更新 | 📚 |
| `style` | 代码格式调整 | 💄 |
| `refactor` | 代码重构 | ♻️ |
| `perf` | 性能优化 | ⚡ |
| `test` | 测试相关 | ✅ |
| `build` | 构建系统变更 | 🔧 |
| `ci` | CI 配置变更 | 👷 |
| `chore` | 其他杂项 | 🔨 |
| `revert` | 回滚提交 | ⏪ |

### 示例

```
feat(auth): 添加用户登录功能

实现了基于 JWT 的用户认证机制，包括：
- 用户名密码登录
- Token 刷新
- 登出功能

Closes #123
```

## ⚙️ 配置选项

在 VSCode 设置中搜索 `gitCommitChecker` 进行配置：

| 设置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `types` | array | 见上表 | 允许的提交类型列表 |
| `typeDescriptions` | object | 见上表 | 类型的中文描述 |
| `subjectMaxLength` | number | 50 | subject 最大长度 |
| `subjectMinLength` | number | 3 | subject 最小长度 |
| `scopeRequired` | boolean | false | scope 是否必填 |
| `bodyRequired` | boolean | false | body 是否必填 |

### 示例配置

```json
{
  "gitCommitChecker.types": ["feat", "fix", "docs", "refactor"],
  "gitCommitChecker.subjectMaxLength": 72,
  "gitCommitChecker.scopeRequired": true
}
```

## 🛠️ 开发

### 环境要求

- Node.js >= 18
- VSCode >= 1.85.0

### 本地开发

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听模式
npm run watch

# 打包
npm run package
```

### 调试

1. 在 VSCode 中打开项目
2. 按 `F5` 启动调试
3. 在新打开的 Extension Development Host 窗口中测试插件

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📚 参考

- [Conventional Commits](https://www.conventionalcommits.org/)
- [VSCode Extension API](https://code.visualstudio.com/api)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
