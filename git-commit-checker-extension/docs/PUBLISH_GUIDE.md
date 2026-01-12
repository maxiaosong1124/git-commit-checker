# 发布 Git Commit Checker 到 VSCode Marketplace

## ✅ 已完成

1. **插件打包成功**: `git-commit-checker-0.0.1.vsix` (29.25 KB)
2. **包含文件**: extension.js, package.json, readme.md, changelog.md, LICENSE

## 📤 发布步骤

### 1. 创建 Azure DevOps 账号
访问 https://dev.azure.com 并注册/登录

### 2. 获取 Personal Access Token (PAT)
1. 登录 Azure DevOps
2. 点击右上角用户图标 → **User settings** → **Personal access tokens**
3. 点击 **+ New Token**
4. 配置:
   - **Name**: vsce-publish
   - **Organization**: All accessible organizations
   - **Expiration**: 选择有效期
   - **Scopes**: 选择 **Custom defined** → 勾选 **Marketplace** → **Manage**
5. 点击 **Create** 并复制 Token（只显示一次！）

### 3. 创建发布者 (Publisher)
```bash
# 登录（会提示输入 PAT）
vsce login <your-publisher-name>

# 或者先创建发布者
vsce create-publisher <your-publisher-name>
```

### 4. 更新 package.json
将 `"publisher": "your-publisher-name"` 改为你的发布者名称

### 5. 发布
```bash
vsce publish
```

---

## 🔧 本地安装测试

在发布前，可以先本地安装测试：
```bash
code --install-extension git-commit-checker-0.0.1.vsix
```
