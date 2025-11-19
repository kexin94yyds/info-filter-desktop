#!/bin/bash

# 信息过滤器 - 快速启动脚本

APP_PATH="$(dirname "$0")/dist/mac-arm64/信息过滤器.app"

if [ -d "$APP_PATH" ]; then
    echo "正在启动 信息过滤器..."
    open "$APP_PATH"
    echo "✅ 应用已启动！按 Cmd + Shift + O 呼出窗口"
else
    echo "❌ 找不到应用文件：$APP_PATH"
    echo ""
    echo "请先运行以下命令打包应用："
    echo "  npm run build:dmg"
    echo ""
    exit 1
fi

