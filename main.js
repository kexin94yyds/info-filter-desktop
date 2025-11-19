const { app, BrowserWindow, globalShortcut, ipcMain, shell, clipboard, screen } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const store = new Store();
let mainWindow;
let captureWindow;
let lastShowAt = 0; // 记录最近一次显示时间，用于忽略刚显示时的 blur

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'icon.png')
  });

  mainWindow.loadFile('dashboard.html');

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createCaptureWindow() {
  captureWindow = new BrowserWindow({
    width: 500,
    height: 450,
    show: false,
    frame: false, // 无边框
    resizable: false,
    alwaysOnTop: true, // 永远置顶
    transparent: true, // 支持透明背景
    hasShadow: true,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  captureWindow.loadFile('capture.html');

  // 失去焦点时隐藏（但忽略刚显示后的短暂失焦）
  captureWindow.on('blur', () => {
    const elapsed = Date.now() - lastShowAt;
    if (elapsed < 800) return; // 忽略刚显示后的短暂失焦
    
    setTimeout(() => {
      try {
        if (captureWindow && !captureWindow.isDestroyed() && !captureWindow.isFocused()) {
          captureWindow.hide();
        }
      } catch (err) {}
    }, 200);
  });
}

// 在所有工作区（包括全屏）显示窗口
async function showCaptureOnActiveSpace() {
  if (!captureWindow || captureWindow.isDestroyed()) {
    createCaptureWindow();
    return;
  }

  // 获取鼠标所在显示器
  const cursorPoint = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPoint);
  const workArea = display.workArea;
  
  const { width: winW, height: winH } = captureWindow.getBounds();
  const targetX = Math.round(workArea.x + (workArea.width - winW) / 2);
  const targetY = Math.round(workArea.y + (workArea.height - winH) / 3); // 偏上一点

  captureWindow.setPosition(targetX, targetY);

  // 临时在所有工作区可见（包括全屏）
  try {
    captureWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } catch (_) {}

  // 使用最高层级
  try {
    captureWindow.setAlwaysOnTop(true, 'screen-saver');
  } catch (_) {}

  captureWindow.show();
  captureWindow.focus();
  lastShowAt = Date.now();

  // 通知渲染进程窗口已显示
  if (captureWindow && !captureWindow.isDestroyed() && captureWindow.webContents) {
    try {
      captureWindow.webContents.send('window-shown');
    } catch (err) {}
  }

  // 稍后还原，仅在当前 Space 可见
  setTimeout(() => {
    try {
      if (captureWindow && !captureWindow.isDestroyed()) {
        captureWindow.setVisibleOnAllWorkspaces(false);
      }
    } catch (_) {}
  }, 200);
}

app.whenReady().then(() => {
  createMainWindow();
  createCaptureWindow();

  // 注册全局快捷键
  globalShortcut.register('CommandOrControl+Shift+O', async () => {
    if (captureWindow) {
      if (captureWindow.isVisible()) {
        captureWindow.hide();
      } else {
        await showCaptureOnActiveSpace();
      }
    } else {
      createCaptureWindow();
    }
  });

  app.on('activate', () => {
    if (!mainWindow) createMainWindow();
    if (mainWindow) mainWindow.show();
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// --- IPC 通信 ---

ipcMain.on('hide-capture-window', () => {
  if (captureWindow) captureWindow.hide();
});

ipcMain.on('item-saved', () => {
  if (mainWindow) {
    mainWindow.webContents.send('refresh-items');
  }
});

ipcMain.on('open-dashboard', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.handle('get-items', () => {
  return store.get('items', []);
});

ipcMain.handle('save-item', (event, item) => {
  const items = store.get('items', []);
  items.unshift(item);
  store.set('items', items);
  return items;
});

ipcMain.handle('delete-item', (event, id) => {
  const items = store.get('items', []);
  const newItems = items.filter(i => i.id !== id);
  store.set('items', newItems);
  return newItems;
});

ipcMain.handle('update-items', (event, newItems) => {
  store.set('items', newItems);
  return newItems;
});

ipcMain.handle('toggle-pin', (event, id) => {
  let items = store.get('items', []);
  const index = items.findIndex(i => i.id === id);
  if (index !== -1) {
    items[index].pinned = !items[index].pinned;
    items.sort((a, b) => {
        if (a.pinned === b.pinned) return 0;
        return a.pinned ? -1 : 1;
    });
    store.set('items', items);
  }
  return items;
});

ipcMain.handle('read-clipboard', () => {
  return clipboard.readText();
});

ipcMain.handle('fetch-metadata', async (event, url) => {
  try {
    if (!url.startsWith('http')) return { title: '', image: '' };
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
      },
      timeout: 5000
    });
    
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const title = $('meta[property="og:title"]').attr('content') || 
                  $('meta[name="twitter:title"]').attr('content') || 
                  $('title').text() || 
                  '';
                  
    const image = $('meta[property="og:image"]').attr('content') || 
                  $('meta[name="twitter:image"]').attr('content') || 
                  '';

    return { title: title.trim(), image };
  } catch (error) {
    console.error('Fetch metadata error:', error);
    return { title: '', image: '' };
  }
});
