# Git Commit Message Checker - VSCode 插件开发计划

## 📋 项目概述

### 项目名称
**Git Commit Message Checker** (git-commit-checker)

### 项目目标
开发一个 VSCode 插件，用于在 Git 提交前自动检查代码差异，并强制用户按照预定义的格式填写 commit 信息，确保团队代码提交信息的统一性和规范性。

### 核心功能
1. **自动检测代码差异** - 使用 git 命令自动获取暂存区的代码变更
2. **Commit 信息格式校验** - 按照预定义规则验证提交信息格式
3. **智能提交引导** - 提供交互式界面引导用户填写规范的 commit 信息
4. **自定义规则配置** - 支持项目级别的提交格式自定义

---

## 🎯 Commit 信息格式规范

### 推荐格式 (Conventional Commits)
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 格式说明

| 字段 | 是否必填 | 说明 |
|------|----------|------|
| `type` | ✅ 必填 | 提交类型，如 feat、fix、docs 等 |
| `scope` | ❌ 可选 | 影响范围，如模块名、文件名 |
| `subject` | ✅ 必填 | 简短描述，不超过 50 个字符 |
| `body` | ❌ 可选 | 详细描述，说明改动原因和内容 |
| `footer` | ❌ 可选 | 关联的 Issue、Breaking Changes 等 |

### 支持的 Type 类型

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式调整（不影响代码逻辑） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `build` | 构建系统或外部依赖变更 |
| `ci` | CI 配置变更 |
| `chore` | 其他杂项 |
| `revert` | 回滚提交 |

---

## 🏗️ 技术架构

### 技术栈
- **开发语言**: TypeScript
- **运行环境**: VSCode Extension API
- **Git 集成**: 使用 Node.js 的 `child_process` 执行 git 命令
- **UI 组件**: VSCode Webview API / QuickPick / InputBox

### 项目结构
```
git-commit-checker/
├── .vscode/
│   ├── launch.json          # 调试配置
│   └── tasks.json            # 构建任务
├── src/
│   ├── extension.ts          # 插件入口
│   ├── commands/
│   │   ├── commit.ts         # 提交命令
│   │   └── checkDiff.ts      # 检查差异命令
│   ├── services/
│   │   ├── gitService.ts     # Git 操作服务
│   │   └── validatorService.ts # 验证器服务
│   ├── ui/
│   │   ├── commitPanel.ts    # 提交面板 Webview
│   │   └── quickInput.ts     # 快速输入组件
│   ├── models/
│   │   └── commitMessage.ts  # Commit 信息模型
│   ├── config/
│   │   └── rules.ts          # 默认规则配置
│   └── utils/
│       └── helpers.ts        # 工具函数
├── resources/
│   └── icons/                # 图标资源
├── test/
│   └── suite/                # 测试文件
├── package.json              # 插件配置清单
├── tsconfig.json             # TypeScript 配置
├── webpack.config.js         # 打包配置
└── README.md                 # 项目说明
```

---

## 📅 开发计划

### 第一阶段：项目初始化（1-2天）

- [ ] 使用 Yeoman 脚手架创建 VSCode 插件项目
- [ ] 配置 TypeScript 和 ESLint
- [ ] 配置 Webpack 打包
- [ ] 设计并实现基础项目结构
- [ ] 编写 package.json 插件配置

### 第二阶段：核心功能开发（3-5天）

#### 2.1 Git 服务模块
- [ ] 实现 `gitService.ts`
  - [ ] 获取当前仓库路径
  - [ ] 检查是否为 Git 仓库
  - [ ] 获取暂存区文件列表 (`git diff --cached --name-only`)
  - [ ] 获取代码差异详情 (`git diff --cached`)
  - [ ] 获取当前分支名
  - [ ] 执行 git commit 命令

#### 2.2 验证器服务模块
- [ ] 实现 `validatorService.ts`
  - [ ] 解析 commit 信息结构
  - [ ] 验证 type 是否合法
  - [ ] 验证 subject 长度
  - [ ] 验证整体格式
  - [ ] 返回验证结果和错误提示

#### 2.3 命令注册
- [ ] 注册 `gitCommitChecker.commit` 命令
- [ ] 注册 `gitCommitChecker.checkDiff` 命令
- [ ] 配置命令快捷键

### 第三阶段：用户界面开发（2-3天）

#### 3.1 快速输入界面
- [ ] 使用 QuickPick 实现 type 选择器
- [ ] 使用 InputBox 实现 scope 和 subject 输入
- [ ] 实现多步骤输入流程

#### 3.2 Webview 面板（可选增强）
- [ ] 设计提交面板 UI
- [ ] 显示代码差异预览
- [ ] 表单式 commit 信息填写
- [ ] 实时格式校验提示

### 第四阶段：配置系统（1-2天）

- [ ] 实现插件设置项
  - [ ] 自定义 type 列表
  - [ ] subject 长度限制
  - [ ] scope 是否必填
  - [ ] 自定义校验正则
- [ ] 支持项目级配置文件 (`.commitcheckerrc.json`)
- [ ] 读取并合并配置

### 第五阶段：测试与优化（2-3天）

- [ ] 编写单元测试
  - [ ] 验证器测试
  - [ ] Git 服务测试
- [ ] 集成测试
- [ ] 边界情况处理
- [ ] 错误提示优化
- [ ] 性能优化

### 第六阶段：文档与发布（1-2天）

- [ ] 编写 README 文档
- [ ] 编写 CHANGELOG
- [ ] 创建演示 GIF/视频
- [ ] 发布到 VSCode Marketplace

---

## 🔧 核心代码设计

### Git 服务接口
```typescript
interface IGitService {
  isGitRepository(): Promise<boolean>;
  getStagedFiles(): Promise<string[]>;
  getStagedDiff(): Promise<string>;
  getCurrentBranch(): Promise<string>;
  commit(message: string): Promise<void>;
}
```

### 验证器接口
```typescript
interface IValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface IValidator {
  validate(message: string): IValidationResult;
  parseMessage(message: string): ICommitMessage;
}
```

### Commit 信息模型
```typescript
interface ICommitMessage {
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  footer?: string;
  raw: string;
}
```

---

## ⚙️ 插件配置项 (package.json contributes)

```json
{
  "contributes": {
    "commands": [
      {
        "command": "gitCommitChecker.commit",
        "title": "Git Commit Checker: 提交"
      },
      {
        "command": "gitCommitChecker.checkDiff",
        "title": "Git Commit Checker: 查看差异"
      }
    ],
    "configuration": {
      "title": "Git Commit Checker",
      "properties": {
        "gitCommitChecker.types": {
          "type": "array",
          "default": ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"],
          "description": "允许的提交类型列表"
        },
        "gitCommitChecker.subjectMaxLength": {
          "type": "number",
          "default": 50,
          "description": "subject 最大长度"
        },
        "gitCommitChecker.scopeRequired": {
          "type": "boolean",
          "default": false,
          "description": "scope 是否必填"
        }
      }
    },
    "keybindings": [
      {
        "command": "gitCommitChecker.commit",
        "key": "ctrl+shift+g c",
        "mac": "cmd+shift+g c"
      }
    ]
  }
}
```

---

## 📊 里程碑

| 里程碑 | 目标 | 预计完成时间 |
|--------|------|--------------|
| M1 | 项目初始化 + 基础架构 | 第 2 天 |
| M2 | Git 服务 + 验证器完成 | 第 5 天 |
| M3 | 用户界面完成 | 第 8 天 |
| M4 | 配置系统完成 | 第 10 天 |
| M5 | 测试完成 | 第 13 天 |
| M6 | 发布到 Marketplace | 第 15 天 |

---

## 🚀 后续扩展功能

1. **AI 辅助生成** - 根据代码差异智能生成 commit 信息建议
2. **团队规范同步** - 从远程服务器同步团队提交规范
3. **提交历史分析** - 统计分析项目提交信息质量
4. **Git Hook 集成** - 生成 pre-commit hook 脚本
5. **多语言支持** - 支持中英文等多语言界面

---

## 📚 参考资源

- [VSCode Extension API](https://code.visualstudio.com/api)
- [Conventional Commits 规范](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [commitlint](https://commitlint.js.org/)

---

> **文档版本**: v1.0  
> **创建日期**: 2026-01-12  
> **作者**: AI Assistant
