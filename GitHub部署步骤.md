# Visorq GitHub 仓库创建和部署指南

## 步骤 1: 在 GitHub 上创建新仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `Visorq`
   - **Description**: `企业级项目组合管理系统 - Enterprise Project Portfolio Management System`
   - **Visibility**: Public（公开）或 Private（私有，但 GitHub Pages 需要 Pro 账户）
   - ⚠️ **不要**勾选 "Add a README file"
   - ⚠️ **不要**勾选 "Add .gitignore"
   - ⚠️ **不要**勾选 "Choose a license"
3. 点击 **Create repository**

## 步骤 2: 推送代码到新仓库

创建仓库后，在项目目录执行以下命令：

```bash
# 已经完成：移除旧的远程仓库
git remote remove origin

# 已经完成：添加新的远程仓库
git remote add origin https://github.com/lekoon/Visorq.git

# 推送代码到新仓库
git push -u origin main
```

## 步骤 3: 部署到 GitHub Pages

推送成功后，执行：

```bash
npm run deploy
```

## 步骤 4: 配置 GitHub Pages（如果需要）

1. 访问 https://github.com/lekoon/Visorq/settings/pages
2. 在 "Source" 下拉菜单中选择 `gh-pages` 分支
3. 点击 **Save**
4. 等待几分钟，GitHub Pages 会自动部署

## 访问地址

部署完成后，您可以通过以下地址访问：

**https://lekoon.github.io/Visorq/**

## 注意事项

- 首次部署可能需要 1-5 分钟才能生效
- 确保仓库设置中 GitHub Pages 已启用
- 如果遇到 404 错误，请检查：
  1. `vite.config.ts` 中的 `base: '/Visorq/'` 配置是否正确
  2. GitHub Pages 是否已启用
  3. 是否选择了正确的分支（gh-pages）

## 默认登录信息

- 用户名: `admin`
- 密码: `admin123`

---

**准备状态**: ✅ 本地配置已完成，等待创建 GitHub 仓库
