document.addEventListener('DOMContentLoaded', async () => {
  const titleInput = document.getElementById('title');
  const urlInput = document.getElementById('url');
  const saveBtn = document.getElementById('saveBtn');
  const openDashBtn = document.getElementById('openDashBtn');
  const statusDiv = document.getElementById('status');

  // 获取当前标签页信息
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab) {
    titleInput.value = tab.title;
    urlInput.value = tab.url;
  }

  // 保存功能
  saveBtn.addEventListener('click', async () => {
    const item = {
      id: Date.now().toString(),
      title: titleInput.value,
      url: urlInput.value,
      category: document.getElementById('category').value,
      note: document.getElementById('note').value,
      platform: getPlatform(urlInput.value),
      createdAt: new Date().toISOString()
    };

    // 获取现有数据
    chrome.storage.local.get(['items'], (result) => {
      const items = result.items || [];
      items.unshift(item); // 加到最前面
      
      // 保存回 storage
      chrome.storage.local.set({ items: items }, () => {
        statusDiv.textContent = '✅ 已保存!';
        saveBtn.textContent = '已保存';
        saveBtn.disabled = true;
        setTimeout(() => {
          statusDiv.textContent = '';
          window.close();
        }, 1500);
      });
    });
  });

  // 打开 Dashboard
  openDashBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'dashboard.html' });
  });
});

function getPlatform(url) {
  if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  return 'Web';
}

