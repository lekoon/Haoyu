# Visorq 部署指南

## 🚀 GitHub Pages 部署

### 前置要求

1. GitHub 账号
2. Git 已安装
3. Node.js 20+ 已安装

### 部署步骤

#### 1. 初始化 Git 仓库（如果还没有）

```bash
git init
git add .
git commit -m "Initial commit: Visorq PMO System"
```

#### 2. 创建 GitHub 仓库

1. 访问 [GitHub](https://github.com)
2. 点击 "New repository"
3. 仓库名称：`Visorq`
4. 设置为 Public（GitHub Pages 免费版需要公开仓库）
5. 不要初始化 README、.gitignore 或 license
6. 点击 "Create repository"

#### 3. 关联远程仓库

```bash
git remote add origin https://github.com/YOUR_USERNAME/Visorq.git
git branch -M main
git push -u origin main
```

#### 4. 配置 GitHub Pages

1. 进入仓库的 Settings
2. 在左侧菜单找到 "Pages"
3. Source 选择 "GitHub Actions"
4. 保存设置

#### 5. 触发部署

推送代码到 main 分支会自动触发部署：

```bash
git push origin main
```

或者在 GitHub 仓库的 Actions 标签页手动触发 workflow。

#### 6. 访问网站

部署完成后，访问：
```
https://YOUR_USERNAME.github.io/Visorq/
```

### 本地测试

在部署前，建议先本地测试构建：

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

### 自动部署

每次推送到 main 分支都会自动触发部署流程：

1. 安装依赖
2. 构建项目
3. 部署到 GitHub Pages

查看部署状态：
- 进入仓库的 "Actions" 标签页
- 查看最新的 workflow 运行状态

### 故障排除

#### 部署失败

1. 检查 Actions 日志查看错误信息
2. 确保 `package.json` 中的依赖都正确
3. 确保 `vite.config.ts` 中的 base 路径正确设置为 `/Visorq/`

#### 页面空白

1. 检查浏览器控制台是否有 404 错误
2. 确认 base 路径配置正确
3. 清除浏览器缓存后重试

#### 路由问题

如果使用了 React Router，需要：
1. 使用 `HashRouter` 而不是 `BrowserRouter`（已配置）
2. 或者配置 GitHub Pages 的 404 重定向

### 环境变量

如果需要使用环境变量：

1. 在 GitHub 仓库的 Settings > Secrets and variables > Actions
2. 添加需要的环境变量
3. 在 `.github/workflows/deploy.yml` 中引用

### 自定义域名（可选）

1. 在仓库根目录创建 `public/CNAME` 文件
2. 文件内容为你的域名，例如：`visorq.example.com`
3. 在域名提供商处配置 DNS：
   - 类型：CNAME
   - 名称：www（或其他子域名）
   - 值：YOUR_USERNAME.github.io

### 更新部署

```bash
# 修改代码后
git add .
git commit -m "Update: description of changes"
git push origin main
```

GitHub Actions 会自动构建并部署最新版本。

### 回滚版本

如果需要回滚到之前的版本：

```bash
# 查看提交历史
git log --oneline

# 回滚到指定提交
git revert COMMIT_HASH

# 推送回滚
git push origin main
```

### 性能优化建议

1. **启用 Gzip 压缩**：GitHub Pages 自动支持
2. **使用 CDN**：考虑使用 Cloudflare 等 CDN 服务
3. **图片优化**：使用 WebP 格式，压缩图片大小
4. **代码分割**：已通过 Vite 自动实现
5. **缓存策略**：利用浏览器缓存

### 监控和分析

1. **Google Analytics**：添加跟踪代码
2. **GitHub Insights**：查看访问统计
3. **性能监控**：使用 Lighthouse 定期检查

## 📦 其他部署选项

### Vercel 部署

```bash
npm install -g vercel
vercel --prod
```

### Netlify 部署

1. 连接 GitHub 仓库
2. 构建命令：`npm run build`
3. 发布目录：`dist`

### Docker 部署

```bash
# 构建镜像
docker build -t visorq .

# 运行容器
docker run -p 80:80 visorq
```

## 🔒 安全建议

1. 不要在代码中硬编码敏感信息
2. 使用环境变量管理配置
3. 定期更新依赖包
4. 启用 HTTPS（GitHub Pages 默认启用）

## 📝 维护

### 定期更新

```bash
# 更新依赖
npm update

# 检查过时的包
npm outdated

# 安全审计
npm audit
npm audit fix
```

### 备份

定期备份：
1. 代码仓库（GitHub 自动备份）
2. 用户数据（如果有后端）
3. 配置文件

## 🎯 下一步

部署完成后，您可以：

1. ✅ 分享网站链接给团队成员
2. ✅ 配置自定义域名
3. ✅ 设置监控和分析
4. ✅ 收集用户反馈
5. ✅ 持续优化和改进

## 📞 支持

如有问题，请：
1. 查看 GitHub Actions 日志
2. 检查 Issues 页面
3. 提交新的 Issue

---

**祝部署顺利！** 🎉
