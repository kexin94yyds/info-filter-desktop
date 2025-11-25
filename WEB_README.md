# Web 版本使用说明

## 部署到 GitHub Pages

1. 将以下文件上传到 GitHub 仓库：
   - `web-dashboard.html` (重命名为 `index.html`)
   - `web-api.js`
   - `web-dashboard.js`
   - `web-manifest.json` (重命名为 `manifest.json`)
   - `image.png` (图标)

2. 在 GitHub 仓库设置中启用 GitHub Pages：
   - Settings → Pages
   - Source: 选择 main 分支
   - 保存

3. 访问：`https://yourusername.github.io/info-filter-desktop/`

## 部署到 Netlify/Vercel

1. 将文件上传到仓库
2. 连接仓库到 Netlify/Vercel
3. 自动部署

## 添加到 iPhone 主屏幕

1. 在 Safari 中打开 Web 版本
2. 点击分享按钮
3. 选择"添加到主屏幕"
4. 即可像原生 App 一样使用

## 功能说明

- ✅ 所有数据存储在浏览器 localStorage（本地）
- ✅ 支持自动抓取网页标题和封面
- ✅ 支持分类过滤
- ✅ 支持置顶功能
- ⚠️ 拖拽排序在移动端可能不太方便（可点击排序）
- ⚠️ 剪贴板读取需要 HTTPS（GitHub Pages 已支持）











