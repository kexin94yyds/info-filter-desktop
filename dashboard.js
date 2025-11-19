const { ipcRenderer } = require('electron');
const Sortable = require('sortablejs');

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('grid');
  const filters = document.getElementById('filters');
  
  let allItems = [];
  let sortableInstance;

  // 监听主进程的刷新通知（比如在悬浮窗口添加了新内容）
  ipcRenderer.on('refresh-items', () => {
    loadItems();
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
      grid.innerHTML = '<div class="empty-state">暂无内容，按 <kbd>Cmd+Shift+O</kbd> 添加</div>';
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
        ${item.image ? `<div style="height: 140px; background-image: url('${item.image}'); background-size: cover; background-position: center;"></div>` : ''}
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
