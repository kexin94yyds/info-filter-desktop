// Web 版本的存储适配器（使用 localStorage）
const webStorage = {
  get: async (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },
  set: async (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }
};

// Web 版本的 API 适配器
const webAPI = {
  // 获取所有收藏
  getItems: async () => {
    return await webStorage.get('items') || [];
  },

  // 保存新收藏
  saveItem: async (item) => {
    const items = await webAPI.getItems();
    items.unshift(item);
    await webStorage.set('items', items);
    return items;
  },

  // 删除收藏
  deleteItem: async (id) => {
    const items = await webAPI.getItems();
    const newItems = items.filter(i => i.id !== id);
    await webStorage.set('items', newItems);
    return newItems;
  },

  // 更新所有收藏（用于排序）
  updateItems: async (newItems) => {
    await webStorage.set('items', newItems);
    return newItems;
  },

  // 切换置顶
  togglePin: async (id) => {
    const items = await webAPI.getItems();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index].pinned = !items[index].pinned;
      items.sort((a, b) => {
        if (a.pinned === b.pinned) return 0;
        return a.pinned ? -1 : 1;
      });
      await webStorage.set('items', items);
    }
    return items;
  },

  // 读取剪贴板（Web API）
  readClipboard: async () => {
    try {
      const text = await navigator.clipboard.readText();
      return text;
    } catch (e) {
      // 降级方案：提示用户手动粘贴
      return '';
    }
  },

  // 抓取元数据（需要后端 API）
  fetchMetadata: async (url) => {
    try {
      // 使用 CORS 代理或后端 API
      // 这里先用一个简单的代理服务
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      const html = data.contents;

      // 使用 DOMParser 解析 HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const title = doc.querySelector('meta[property="og:title"]')?.content ||
        doc.querySelector('meta[name="twitter:title"]')?.content ||
        doc.querySelector('title')?.textContent || '';

      const image = doc.querySelector('meta[property="og:image"]')?.content ||
        doc.querySelector('meta[name="twitter:image"]')?.content || '';

      return { title: title.trim(), image };
    } catch (error) {
      console.error('Fetch metadata error:', error);
      return { title: '', image: '' };
    }
  }
};

// PeerJS API 适配器 (用于 WebRTC P2P 连接)
const peerAPI = {
  conn: null,
  dataCallback: null,

  init: (peerId) => {
    const updateStatus = (status, msg) => {
      const el = document.getElementById('status-bar');
      if (el) {
        el.style.display = 'block';
        if (status === 'connected') {
          el.style.background = '#d1fae5';
          el.style.color = '#065f46';
          el.textContent = '已连接到桌面端';
          setTimeout(() => { el.style.display = 'none'; }, 3000);
        } else if (status === 'connecting') {
          el.style.background = '#fef3c7';
          el.style.color = '#92400e';
          el.textContent = '正在连接桌面端...';
        } else {
          el.style.background = '#fee2e2';
          el.style.color = '#991b1b';
          el.textContent = msg || '连接断开';
        }
      }
    };

    return new Promise((resolve, reject) => {
      updateStatus('connecting');

      const peer = new Peer(null, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      peer.on('open', () => {
        console.log('My Peer ID:', peer.id);
        const conn = peer.connect(peerId, {
          reliable: true
        });

        conn.on('open', () => {
          console.log('Connected to Desktop App');
          peerAPI.conn = conn;
          updateStatus('connected');

          // 请求初始数据
          conn.send({ type: 'get-items' });
          resolve(true);
        });

        conn.on('data', (data) => {
          console.log('Received data:', data);
          if (data.type === 'items-updated' && peerAPI.dataCallback) {
            peerAPI.dataCallback(data.items);
          }
        });

        conn.on('close', () => {
          updateStatus('disconnected', '连接已断开，请刷新页面重试');
          peerAPI.conn = null;
        });

        conn.on('error', (err) => {
          console.error('Connection error:', err);
          updateStatus('error', '连接错误');
          reject(err);
        });
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        updateStatus('error', `连接失败: ${err.type}`);
        reject(err);
      });
    });
  },

  getItems: async () => {
    if (peerAPI.conn) {
      peerAPI.conn.send({ type: 'get-items' });
      // 这里是个异步问题，简单起见我们等待回调更新，或者返回空数组等待推送
      return [];
    }
    return [];
  },

  saveItem: async (item) => {
    if (peerAPI.conn) {
      peerAPI.conn.send({ type: 'save-item', item });
    }
    return []; // 乐观更新或等待推送
  },

  deleteItem: async (id) => {
    if (peerAPI.conn) {
      peerAPI.conn.send({ type: 'delete-item', id });
    }
    return [];
  },

  updateItems: async (items) => {
    if (peerAPI.conn) {
      peerAPI.conn.send({ type: 'update-items', items });
    }
    return items;
  },

  togglePin: async (id) => {
    if (peerAPI.conn) {
      peerAPI.conn.send({ type: 'toggle-pin', id });
    }
    return [];
  },

  readClipboard: async () => {
    try {
      return await navigator.clipboard.readText();
    } catch (e) {
      return '';
    }
  },

  fetchMetadata: async (url) => {
    // 可以请求桌面端帮忙抓取，解决跨域问题
    return { title: '', image: '' };
  },

  subscribe: (callback) => {
    peerAPI.dataCallback = callback;
  }
};

// 导出适配的 API
(async function initAPI() {
  let isElectron = false;
  try {
    if (typeof require !== 'undefined') {
      const electron = require('electron');
      isElectron = !!electron;
    }
  } catch (e) {
    isElectron = false;
  }

  if (isElectron) {
    // Electron 环境
    try {
      const { ipcRenderer } = require('electron');
      window.webAPI = {
        getItems: () => ipcRenderer.invoke('get-items'),
        saveItem: (item) => ipcRenderer.invoke('save-item', item),
        deleteItem: (id) => ipcRenderer.invoke('delete-item', id),
        updateItems: (items) => ipcRenderer.invoke('update-items', items),
        togglePin: (id) => ipcRenderer.invoke('toggle-pin', id),
        readClipboard: () => ipcRenderer.invoke('read-clipboard'),
        fetchMetadata: (url) => ipcRenderer.invoke('fetch-metadata', url),
        getMobileConnectInfo: () => ipcRenderer.invoke('get-mobile-connect-info'),
        subscribe: (callback) => {
          ipcRenderer.on('refresh-items', async () => {
            const items = await ipcRenderer.invoke('get-items');
            callback(items);
          });
        }
      };
    } catch (e) {
      window.webAPI = webAPI;
    }
  } else {
    // Web 环境
    const urlParams = new URLSearchParams(window.location.search);
    const peerId = urlParams.get('peer');

    if (peerId) {
      console.log('Connecting via PeerJS to:', peerId);
      window.webAPI = peerAPI;
      peerAPI.init(peerId).catch(err => {
        console.error('Peer init failed:', err);
        alert(`连接失败: ${err.type || err.message || err}\n请检查桌面端是否在线，或尝试刷新页面。`);
      });
    } else {
      // 默认本地模式
      console.log('Running in Standalone Web Mode');
      window.webAPI = {
        ...webAPI,
        subscribe: (callback) => {
          window.addEventListener('storage', (e) => {
            if (e.key === 'items') {
              callback(JSON.parse(e.newValue));
            }
          });
        }
      };
    }
  }
})();

