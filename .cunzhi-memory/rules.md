# 开发规范和规则

- # 信息过滤器 - 全屏 Space 窗口跳动问题修复

## 问题描述
提示词窗口在不同桌面/全屏 Space 呼出时跳回固定桌面，而不是在当前 Space 就地显示。

## 根本原因
Electron 窗口在调用 `setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })` 后，如果在显示后立即调用 `setVisibleOnAllWorkspaces(false)`，macOS 会把窗口"拉回"到它最初所在的 Space，而不是停留在当前激活的 Space/全屏应用上。

## 解决方案
在 `showCaptureOnActiveSpace` 函数中保持 `setVisibleOnAllWorkspaces(true)` 在显示期间生效，避免系统把窗口拉回旧 Space。用户选择一直保持在所有工作区可见的方案。

## 关键代码修改
- 移除了之前 200ms 后调用 `setVisibleOnAllWorkspaces(false)` 的逻辑
- 添加了调试日志输出，包括鼠标位置、显示器信息、窗口位置坐标
- 添加了快捷键注册成功/失败的日志输出

## 快捷键
- 使用 `CommandOrControl+Shift+I` 呼出/隐藏提示词窗口
- 代码中已有正确的错误处理，不存在 `toggleWindow is not defined` 问题

## 调试技巧
- 开发环境：控制台直接输出 console.log 内容
- 可以通过 [DEBUG] 日志查看窗口定位和显示状态
- 快捷键注册状态会显示成功或失败信息
