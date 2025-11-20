const { ipcRenderer } = require('electron');
const Sortable = require('sortablejs');

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('grid');
  const filters = document.getElementById('filters');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');

  let allItems = [];
  let sortableInstance;

  // PeerJS Host Logic
  let peer;
  let peerId;

  async function initPeer() {
    // const { Peer } = require('peerjs'); // Don't use require, use global from CDN
    peer = new Peer(null, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    }); // Auto-generate ID

    peer.on('open', (id) => {
      console.log('My Peer ID:', id);
      peerId = id;
    });

    peer.on('connection', (conn) => {
      console.log('New peer connection');

      // Keep connection open
      conn.on('open', () => {
        console.log('Connection opened with:', conn.peer);
        // Send initial data immediately
        ipcRenderer.invoke('get-items').then(items => {
          conn.send({ type: 'items-updated', items });
        });
      });

      conn.on('data', async (data) => {
        console.log('Received from peer:', data);

        if (data.type === 'get-items') {
          const items = await ipcRenderer.invoke('get-items');
          conn.send({ type: 'items-updated', items });
        } else if (data.type === 'save-item') {
          await ipcRenderer.invoke('save-item', data.item);
          broadcastUpdate();
        } else if (data.type === 'delete-item') {
          await ipcRenderer.invoke('delete-item', data.id);
          broadcastUpdate();
        } else if (data.type === 'update-items') {
          await ipcRenderer.invoke('update-items', data.items);
          broadcastUpdate();
        } else if (data.type === 'toggle-pin') {
          await ipcRenderer.invoke('toggle-pin', data.id);
          broadcastUpdate();
        } else if (data.type === 'ping') {
          conn.send({ type: 'pong' });
        }
      });
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
    });
  }

  async function broadcastUpdate() {
    if (!peer) return;
    const items = await ipcRenderer.invoke('get-items');
    // Refresh local UI
    loadItems();

    // Broadcast to connected peers
    if (peer.connections) {
      Object.values(peer.connections).forEach(conns => {
        conns.forEach(conn => {
          if (conn.open) {
            conn.send({ type: 'items-updated', items });
          }
        });
      });
    }
  }

  // Initialize PeerJS
  initPeer();

  // 监听主进程的刷新通知
  ipcRenderer.on('refresh-items', () => {
    loadItems();
    broadcastUpdate(); // Also sync to peers
  });

  // ... (Export/Import logic remains same) ...
  // 导出功能
  exportBtn.addEventListener('click', async () => {
    const items = await ipcRenderer.invoke('get-items');
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `info-filter-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // 导入功能
  importBtn.addEventListener('click', () => {
    importFile.click();
  });

  // 手机连接按钮逻辑
  const mobileConnectBtn = document.createElement('button');
  mobileConnectBtn.className = 'add-btn';
  mobileConnectBtn.style.background = '#10b981'; // 绿色
  mobileConnectBtn.style.marginLeft = '8px';
  mobileConnectBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: text-bottom; margin-right: 4px;">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
      <line x1="12" y1="18" x2="12" y2="18"></line>
    </svg>
    手机连接
  `;
  document.querySelector('.actions').appendChild(mobileConnectBtn);

  mobileConnectBtn.addEventListener('click', async () => {
    if (!peerId) {
      alert('正在初始化远程连接服务，请稍后再试...');
      return;
    }
    // const { url, qrCode } = await ipcRenderer.invoke('get-mobile-connect-info');
    // Use Netlify URL + Peer ID
    const baseUrl = 'https://info-flow.netlify.app'; // Updated based on user's project name
    const url = `${baseUrl}/web-dashboard.html?peer=${peerId}`;
    const QRCode = require('qrcode');
    const qrCode = await QRCode.toDataURL(url);

    // 创建一个简单的模态框显示二维码
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;';

    const modal = document.createElement('div');
    modal.style.cssText = 'background: white; padding: 30px; border-radius: 16px; text-align: center; max-width: 400px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);';

    modal.innerHTML = `
      <h2 style="margin-top: 0;">手机扫码连接 (Netlify)</h2>
      <p style="color: #666; font-size: 14px;">无需同一 WiFi，可远程连接</p>
      <img src="${qrCode}" style="width: 200px; height: 200px; margin: 10px 0;">
      <div style="background: #f3f4f6; padding: 10px; border-radius: 8px; margin-top: 10px;">
        <a href="${url}" target="_blank" style="color: #2563eb; word-break: break-all; font-size: 12px;">${url}</a>
      </div>
      <p style="font-size: 12px; color: #999; margin-top: 8px;">请确保已将 web-dashboard.html 部署到 Netlify</p>
      <button id="closeModal" style="margin-top: 20px; padding: 8px 24px; background: #e5e7eb; border: none; border-radius: 8px; cursor: pointer;">关闭</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector('#closeModal').onclick = () => document.body.removeChild(overlay);
    overlay.onclick = (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    };
  });

  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedItems = JSON.parse(e.target.result);
        if (!Array.isArray(importedItems)) {
          alert('文件格式错误：必须是 JSON 数组');
          return;
        }

        if (confirm(`准备导入 ${importedItems.length} 条数据。是否合并到现有数据中？\n(点击"取消"将放弃导入)`)) {
          const currentItems = await ipcRenderer.invoke('get-items');
          // 合并策略：ID 去重，保留导入的数据优先
          const map = new Map();

          importedItems.forEach(item => map.set(item.id, item));
          currentItems.forEach(item => {
            if (!map.has(item.id)) {
              map.set(item.id, item);
            }
          });

          const mergedItems = Array.from(map.values()).sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });

          await ipcRenderer.invoke('update-items', mergedItems);
          loadItems();
          alert('导入成功！');
        }
      } catch (err) {
        console.error(err);
        alert('导入失败：无法解析文件');
      }
      importFile.value = '';
    };
    reader.readAsText(file);
  });

  function initSortable() {
    if (sortableInstance) sortableInstance.destroy();

    sortableInstance = new Sortable(grid, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      delay: 100,
      onEnd: async (evt) => {
        const newIds = Array.from(grid.children).map(card => card.dataset.id);
        const newOrderItems = [];
        newIds.forEach(id => {
          const item = allItems.find(i => i.id === id);
          if (item) newOrderItems.push(item);
        });

        const currentFilter = document.querySelector('.filter-btn.active').dataset.filter;
        if (currentFilter === 'all') {
          allItems = newOrderItems;
          await ipcRenderer.invoke('update-items', allItems);
        }
      }
    });
  }

  loadItems();

  filters.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');

      const filter = e.target.dataset.filter;
      if (sortableInstance) {
        sortableInstance.option('disabled', filter !== 'all');
      }
      renderGrid(filter === 'all' ? allItems : allItems.filter(item => item.platform === filter));
    }
  });

  async function loadItems() {
    allItems = await ipcRenderer.invoke('get-items');

    // 如果没有打开，尝试渲染（通常主窗口是开着的）
    // 获取当前选中的 filter，以便刷新时保持 filter 状态
    const activeBtn = document.querySelector('.filter-btn.active');
    const filter = activeBtn ? activeBtn.dataset.filter : 'all';

    renderGrid(filter === 'all' ? allItems : allItems.filter(item => item.platform === filter));
  }

  function renderGrid(items) {
    grid.innerHTML = '';

    if (items.length === 0) {
      grid.innerHTML = '<div class="empty-state">暂无内容，按 <kbd>Cmd+Shift+I</kbd> 添加</div>';
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = `card ${item.pinned ? 'pinned' : ''}`;
      card.dataset.id = item.id;

      card.innerHTML = `
        <div class="pin-icon" title="${item.pinned ? '取消置顶' : '置顶'}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="17" x2="12" y2="22"></line>
            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
          </svg>
        </div>
        ${item.image ? `<div style="height: 140px; background-image: url('${item.image}'); background-size: contain; background-repeat: no-repeat; background-position: center; background-color: #f3f4f6;"></div>` : ''}
        <div class="card-content">
          <div class="card-meta">
            <span class="platform-tag platform-${item.platform}">${item.platform}</span>
            <span class="category-tag">${getCategoryName(item.category)}</span>
          </div>
          <h3 class="card-title">
            <a href="${item.url}" target="_blank">${escapeHtml(item.title)}</a>
          </h3>
          ${item.note ? `<div class="card-note">${escapeHtml(item.note)}</div>` : ''}
        </div>
        <div class="card-footer">
          <span class="date">${new Date(item.createdAt).toLocaleDateString()}</span>
          <button class="delete-btn" data-id="${item.id}">删除</button>
        </div>
      `;

      card.querySelector('.pin-icon').addEventListener('click', async (e) => {
        e.stopPropagation();
        allItems = await ipcRenderer.invoke('toggle-pin', item.id);
        loadItems(); // 重新加载以触发排序
      });

      grid.appendChild(card);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (confirm('确定要删除吗？')) {
          allItems = await ipcRenderer.invoke('delete-item', id);
          loadItems();
        }
      });
    });

    initSortable();
  }

  function getCategoryName(key) {
    const map = { 'read_later': '稍后阅读', 'learning': '学习资料', 'inspiration': '灵感', 'entertainment': '娱乐' };
    return map[key] || key;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
