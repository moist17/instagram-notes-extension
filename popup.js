// 載入所有備註
function loadNotes() {
    chrome.storage.local.get(null, function(items) {
      const notes = [];
      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      console.log('Popup: 開始載入備註，所有儲存項目:', items);
      
      for (let key in items) {
        // 只處理備註內容，排除時間戳記和標籤
        if (key.startsWith('ig_note_') && !key.includes('_time_') && !key.includes('_tags_')) {
          const username = key.replace('ig_note_', '');
          const note = items[key];
          const timestamp = items[`ig_note_time_${username}`] || now;
          const tags = items[`ig_note_tags_${username}`] || [];
          
          console.log(`找到備註: ${username}, 內容長度: ${note ? note.length : 0}, 標籤:`, tags);
          
          if (note && note.trim()) {
            notes.push({
              username: username,
              note: note,
              timestamp: timestamp,
              tags: tags
            });
          }
        }
      }
      
      console.log(`Popup: 共找到 ${notes.length} 筆備註`);
      
      // 按時間排序（最新的在前）
      notes.sort((a, b) => b.timestamp - a.timestamp);
      
      // 更新統計
      document.getElementById('totalNotes').textContent = notes.length;
      
      const recentCount = notes.filter(n => n.timestamp > sevenDaysAgo).length;
      document.getElementById('recentNotes').textContent = recentCount;
      
      // 顯示最近的備註
      displayRecentNotes(notes.slice(0, 5));
    });
  }
  
  // 顯示最近的備註
  function displayRecentNotes(notes) {
    const notesList = document.getElementById('notesList');
    
    if (notes.length === 0) {
      notesList.innerHTML = `
        <div class="empty-state">
          還沒有任何備註<br>
          前往 Instagram 個人檔案頁面開始新增吧！
        </div>
      `;
      return;
    }
    
    notesList.innerHTML = notes.map(note => `
      <div class="note-item" data-username="${note.username}">
        <div class="note-username">@${note.username}</div>
        <div class="note-text">${escapeHtml(note.note)}</div>
      </div>
    `).join('');
    
    // 加入點擊事件
    document.querySelectorAll('.note-item').forEach(item => {
      item.addEventListener('click', function() {
        const username = this.dataset.username;
        chrome.tabs.create({ url: `https://www.instagram.com/${username}/` });
      });
    });
  }
  
  // 跳脫 HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // 開啟管理頁面
  document.getElementById('openManager').addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
  });
  
  // 匯出資料
  document.getElementById('exportData').addEventListener('click', function() {
    chrome.storage.local.get(null, function(items) {
      const notes = [];
      
      for (let key in items) {
        if (key.startsWith('ig_note_') && !key.includes('_time_')) {
          const username = key.replace('ig_note_', '');
          const note = items[key];
          const timestamp = items[`ig_note_time_${username}`];
          
          if (note && note.trim()) {
            notes.push({
              帳號: username,
              備註: note,
              建立時間: timestamp ? new Date(timestamp).toLocaleString('zh-TW') : '未知'
            });
          }
        }
      }
      
      if (notes.length === 0) {
        alert('目前沒有任何備註可以匯出');
        return;
      }
      
      // 轉換成 CSV
      const headers = ['帳號', '備註', '建立時間'];
      const csvContent = [
        headers.join(','),
        ...notes.map(note => 
          headers.map(h => `"${(note[h] || '').replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');
      
      // 下載
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `instagram_notes_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });
  });
  
  // 初始載入
  loadNotes();