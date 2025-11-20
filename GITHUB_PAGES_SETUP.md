# 启用 GitHub Pages 的详细步骤

## 🔧 手动启用 GitHub Pages

### 步骤 1：访问设置页面

直接在浏览器中打开：
**https://github.com/kexin94yyds/info-filter-desktop/settings/pages**

或者：
1. 访问仓库：https://github.com/kexin94yyds/info-filter-desktop
2. 点击顶部的 **Settings** 标签
3. 在左侧菜单中找到 **Pages**

### 步骤 2：配置设置

在 **Source** 部分：
- 选择 **"GitHub Actions"**（不是 "Deploy from a branch"）
- 点击 **Save** 按钮

### 步骤 3：等待部署

- GitHub Actions 会自动开始部署
- 通常需要 1-2 分钟
- 可以在 **Actions** 标签页查看部署进度

### 步骤 4：访问网站

部署完成后，访问：
**https://kexin94yyds.github.io/info-filter-desktop/**

## ✅ 已完成的准备工作

- ✅ `index.html` 已创建
- ✅ `web-api.js` 已创建
- ✅ `web-dashboard.js` 已创建
- ✅ `manifest.json` 已创建
- ✅ `.nojekyll` 已添加（避免 Jekyll 处理）
- ✅ GitHub Actions 工作流已配置

## 🚨 如果还是 404

1. **检查 Actions**：
   - 访问：https://github.com/kexin94yyds/info-filter-desktop/actions
   - 查看是否有 "Deploy to GitHub Pages" 工作流运行
   - 如果有错误，查看错误日志

2. **检查文件**：
   - 确保 `index.html` 在仓库根目录
   - 访问：https://github.com/kexin94yyds/info-filter-desktop/blob/main/index.html
   - 确认文件存在

3. **等待更长时间**：
   - 有时需要 5-10 分钟才能生效
   - DNS 传播可能需要时间

4. **清除缓存**：
   - 在 iPhone Safari 中清除缓存
   - 或使用无痕模式访问

## 📱 部署成功后

1. 在 iPhone Safari 中打开网站
2. 点击分享按钮
3. 选择"添加到主屏幕"
4. 即可像原生 App 一样使用！



