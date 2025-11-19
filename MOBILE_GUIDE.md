# 在 iPhone 上使用信息过滤器

## 🚀 快速开始

### 方法一：通过 GitHub Pages（推荐）

1. **启用 GitHub Pages**：
   - 访问：https://github.com/kexin94yyds/info-filter-desktop/settings/pages
   - Source: 选择 `main` 分支
   - Folder: 选择 `/ (root)`
   - 点击 Save

2. **等待部署**（通常 1-2 分钟）

3. **访问 Web 版本**：
   - 在 iPhone Safari 中打开：`https://kexin94yyds.github.io/info-filter-desktop/`

4. **添加到主屏幕**：
   - 点击 Safari 底部的分享按钮
   - 选择"添加到主屏幕"
   - 即可像原生 App 一样使用！

### 方法二：本地测试

1. 在项目目录运行简单的 HTTP 服务器：
```bash
# Python 3
python3 -m http.server 8000

# 或使用 Node.js
npx serve .
```

2. 在 iPhone 的 Safari 中访问：`http://你的电脑IP:8000`

## ✨ 功能特点

- ✅ **完全离线**：数据存储在浏览器本地（localStorage）
- ✅ **自动抓取**：粘贴链接后自动获取标题和封面
- ✅ **分类过滤**：按平台（Twitter、YouTube、Web）过滤
- ✅ **置顶功能**：重要内容可以置顶
- ✅ **PWA 支持**：可添加到主屏幕，像原生 App

## 📱 使用技巧

1. **添加内容**：
   - 复制链接
   - 打开应用
   - 点击"添加"按钮
   - 粘贴链接（会自动填入）
   - 点击"保存"

2. **查看收藏**：
   - 打开应用即可看到所有收藏
   - 使用顶部过滤器切换平台
   - 点击卡片打开链接

3. **管理内容**：
   - 点击图钉图标置顶
   - 点击删除按钮删除

## ⚠️ 注意事项

- 数据存储在浏览器本地，清除浏览器数据会丢失
- 建议定期导出数据备份
- 剪贴板读取需要 HTTPS（GitHub Pages 已支持）

## 🔄 与桌面版的区别

| 功能 | 桌面版 | Web 版 |
|------|--------|--------|
| 全局快捷键 | ✅ | ❌ |
| 拖拽排序 | ✅ | ⚠️（移动端不便） |
| 数据存储 | electron-store | localStorage |
| 离线使用 | ✅ | ✅ |
| 跨设备同步 | ❌ | ❌ |

## 🛠️ 故障排除

### 无法读取剪贴板
- 确保使用 HTTPS（GitHub Pages 已支持）
- 或手动粘贴链接

### 数据丢失
- 检查是否清除了浏览器数据
- 数据存储在浏览器本地，不会同步到其他设备

