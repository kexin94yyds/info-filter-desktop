# 信息过滤器 - 桌面版

一个优雅的桌面应用，用于收藏和管理 Twitter、YouTube 等平台的内容。

## ✨ 功能特点

- **全局快捷键**: `Cmd+Shift+O` 快速呼出添加窗口
- **自动抓取**: 粘贴链接后自动获取标题和封面图
- **一键保存**: 按 `Enter` 键即可保存
- **拖拽排序**: 支持卡片拖拽排序
- **置顶功能**: 重要内容可以置顶
- **分类过滤**: 按平台（Twitter、YouTube、Web）过滤
- **全屏支持**: 窗口可以在全屏应用上显示

## 🚀 快速开始

### 开发模式

```bash
npm install
npm start
```

### 打包应用

#### Mac (DMG 安装包)
```bash
npm run build:dmg
```
打包完成后，DMG 文件在 `dist/` 目录下。

#### Mac (应用目录)
```bash
npm run build
```
打包完成后，应用在 `dist/mac-arm64/信息过滤器.app`

#### Windows
```bash
npm run build:win
```

### 启动打包后的应用

```bash
./启动应用.sh
```

或者直接双击：
- Mac: `dist/mac-arm64/信息过滤器.app`
- Windows: `dist/信息过滤器 Setup.exe`

## 📖 使用说明

1. **添加内容**:
   - 复制链接
   - 按 `Cmd+Shift+O` 呼出窗口
   - 链接会自动填入并抓取信息
   - 按 `Enter` 保存

2. **查看收藏**:
   - 打开主窗口（通过 Dock 或再次按快捷键）
   - 使用顶部过滤器切换平台
   - 点击卡片打开链接

3. **管理内容**:
   - 拖拽卡片排序（仅在"全部"视图）
   - 点击图钉图标置顶
   - 点击删除按钮删除

## 🛠️ 技术栈

- **Electron**: 跨平台桌面应用框架
- **electron-store**: 本地数据存储
- **SortableJS**: 拖拽排序
- **cheerio**: HTML 解析和元数据抓取

## 📁 数据存储

所有数据存储在本地：
- Mac: `~/Library/Application Support/info-filter-desktop/`
- Windows: `%APPDATA%/info-filter-desktop/`

## 🔧 故障排除

### 快捷键不起作用
1. 确保应用正在运行
2. 检查是否有其他应用占用了相同快捷键
3. 尝试重启应用

### 窗口无法显示
- 确保应用有必要的权限
- 尝试重启应用

## 📝 许可证

ISC

