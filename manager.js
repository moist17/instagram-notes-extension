import { backupToCloud, restoreFromCloud, checkBackup } from './simple-backup.js';

let allNotes = [];
let currentEditUsername = '';

// 載入所有備註
function loadAllNotes() {
  chrome.storage.local.get(null, function(items) {
    allNotes = [];
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    for (let key in items) {
      // 只處理備註內容，排除時間戳記和標籤
      if (key.startsWith('ig_note_') && !key.includes('_time_') && !key.includes('_tags_')) {
        const username = key.replace('ig_note_', '');
        const note = items[key];
        const timestamp = items[`ig_note_time_${username}`] || now;
        const tags = items[`ig_note_tags_${username}`] || [];
        
        if (note && note.trim()) {
          allNotes.push({
            username: username,
            note: note,
            timestamp: timestamp,
            tags: tags
          });
        }
      }
    }
    
    // 按時間排序（最新的在前）
    allNotes.sort((a, b) => b.timestamp - a.timestamp);
    
    // 更新統計
    document.getElementById('totalNotes').textContent = allNotes.length;
    document.getElementById('thisWeek').textContent = allNotes.filter(n => n.timestamp > oneWeekAgo).length;
    document.getElementById('thisMonth').textContent = allNotes.filter(n => n.timestamp > oneMonthAgo).length;
    
    // 顯示表格
    displayTable(allNotes);
  });
}

// 顯示表格
function displayTable(notes) {
  const tableBody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const table = document.getElementById('notesTable');
  
  if (notes.length === 0) {
    table.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  table.style.display = 'table';
  emptyState.style.display = 'none';
  
  // ✅ 移除 onclick，改用 data-username
  tableBody.innerHTML = notes.map(note => `
    <tr data-username="${note.username}">
      <td>
        <span class="username-cell" data-username="${note.username}">
          @${escapeHtml(note.username)}
        </span>
      </td>
      <td>
        ${note.tags && note.tags.length > 0 
          ? note.tags.map(tag => `<span class="table-tag">${escapeHtml(tag)}</span>`).join(' ')
          : '<span style="color: #999;">無標籤</span>'
        }
      </td>
      <td class="note-cell">${escapeHtml(note.note)}</td>
      <td>${formatDate(note.timestamp)}</td>
      <td>
        <div class="actions-cell">
          <button class="icon-btn edit-btn" data-username="${note.username}" title="編輯">
            ✏️
          </button>
          <button class="icon-btn delete-btn" data-username="${note.username}" title="刪除">
            🗑️
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// 格式化日期
function formatDate(timestamp) {
  if (!timestamp) return '未知';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  
  return date.toLocaleDateString('zh-TW', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
}

// 跳脫 HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 開啟 Instagram
function openInstagram(username) {
  window.open(`https://www.instagram.com/${username}/`, '_blank');
}

// 編輯備註
function editNote(username) {
  const note = allNotes.find(n => n.username === username);
  if (!note) return;
  
  currentEditUsername = username;
  document.getElementById('editUsername').value = `@${username}`;
  document.getElementById('editNote').value = note.note;
  document.getElementById('editModal').classList.add('show');
}

// 刪除備註
function deleteNote(username) {
  if (!confirm(`確定要刪除 @${username} 的備註嗎？`)) {
    return;
  }
  
  const key = `ig_note_${username}`;
  const timeKey = `ig_note_time_${username}`;
  const tagsKey = `ig_note_tags_${username}`;
  
  chrome.storage.local.remove([key, timeKey, tagsKey], function() {
    loadAllNotes();
  });
}

// ✅ 新增：統一的事件委派處理
document.addEventListener('click', function(e) {
  // 處理使用者名稱點擊
  if (e.target.closest('.username-cell')) {
    const username = e.target.closest('.username-cell').dataset.username;
    if (username) {
      openInstagram(username);
    }
  }
  
  // 處理編輯按鈕
  if (e.target.closest('.edit-btn')) {
    const username = e.target.closest('.edit-btn').dataset.username;
    if (username) {
      editNote(username);
    }
  }
  
  // 處理刪除按鈕
  if (e.target.closest('.delete-btn')) {
    const username = e.target.closest('.delete-btn').dataset.username;
    if (username) {
      deleteNote(username);
    }
  }
});

// 儲存編輯
document.getElementById('saveEdit').addEventListener('click', function() {
  const newNote = document.getElementById('editNote').value.trim();
  
  if (!newNote) {
    alert('備註內容不能為空！');
    return;
  }
  
  const key = `ig_note_${currentEditUsername}`;
  const timeKey = `ig_note_time_${currentEditUsername}`;
  const data = {};
  data[key] = newNote;
  data[timeKey] = Date.now();
  
  chrome.storage.local.set(data, function() {
    document.getElementById('editModal').classList.remove('show');
    loadAllNotes();
  });
});

// 取消編輯
document.getElementById('cancelEdit').addEventListener('click', function() {
  document.getElementById('editModal').classList.remove('show');
});

// 點擊模態框背景關閉
document.getElementById('editModal').addEventListener('click', function(e) {
  if (e.target === this) {
    this.classList.remove('show');
  }
});

// 搜尋功能
document.getElementById('searchInput').addEventListener('input', function(e) {
  const searchTerm = e.target.value.toLowerCase().trim();
  
  if (!searchTerm) {
    displayTable(allNotes);
    return;
  }
  
  const filtered = allNotes.filter(note => 
    note.username.toLowerCase().includes(searchTerm) ||
    note.note.toLowerCase().includes(searchTerm)
  );
  
  displayTable(filtered);
});

// 重新載入
document.getElementById('refreshBtn').addEventListener('click', function() {
  loadAllNotes();
});

// 匯出 CSV
document.getElementById('exportBtn').addEventListener('click', function() {
  if (allNotes.length === 0) {
    alert('目前沒有任何備註可以匯出');
    return;
  }
  
  // 準備 CSV 資料
  const headers = ['帳號', '標籤', '備註', '建立時間'];
  const rows = allNotes.map(note => [
    note.username,
    note.tags && note.tags.length > 0 ? note.tags.join(', ') : '',
    note.note,
    note.timestamp ? new Date(note.timestamp).toLocaleString('zh-TW') : '未知'
  ]);
  
  // 轉換成 CSV 格式
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n');
  
  // 下載
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `instagram_notes_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

// 同步到 Google Sheets
document.getElementById('syncBtn').addEventListener('click', async function() {
  // 先檢查是否已設定 Google Sheets URL
  chrome.storage.local.get(['google_sheets_url'], async function(result) {
    let sheetsUrl = result.google_sheets_url;
    
    // 如果還沒設定，詢問使用者
    if (!sheetsUrl) {
      sheetsUrl = prompt(
        '請貼上你的 Google Apps Script 網頁應用程式網址：\n\n' +
        '（這個網址只需要設定一次，之後會記住）'
      );
      
      if (!sheetsUrl) {
        return; // 使用者取消
      }
      
      // 儲存網址
      chrome.storage.local.set({ google_sheets_url: sheetsUrl });
    }
    
    if (allNotes.length === 0) {
      alert('目前沒有任何備註可以同步');
      return;
    }
    
    // 準備資料
    const syncData = {
      notes: allNotes.map(note => ({
        username: note.username,
        tags: note.tags || [],
        note: note.note,
        timestamp: note.timestamp
      }))
    };
    
    // 顯示載入中
    const btn = document.getElementById('syncBtn');
    const originalText = btn.textContent;
    btn.textContent = '⏳ 同步中...';
    btn.disabled = true;
    
    try {
      // 發送到 Google Sheets
      const response = await fetch(sheetsUrl, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script 需要這個
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(syncData)
      });
      
      // 注意：no-cors 模式下無法讀取回應
      // 所以我們假設成功
      alert(`✅ 已同步 ${allNotes.length} 筆備註到 Google Sheets！`);
      
    } catch (error) {
      console.error('同步錯誤:', error);
      
      // 詢問是否要重新設定網址
      if (confirm('同步失敗！是否要重新設定 Google Sheets 網址？')) {
        chrome.storage.local.remove(['google_sheets_url']);
        document.getElementById('syncBtn').click(); // 重新觸發
      }
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
});

// 初始載入
loadAllNotes();

// ========== 雲端備份功能 ==========

// 備份按鈕
document.getElementById('backupBtn').addEventListener('click', async function() {
  const btn = this;
  const originalText = btn.textContent;
  
  btn.textContent = '⏳ 備份中...';
  btn.disabled = true;
  
  const result = await backupToCloud();
  
  if (result.success) {
    alert(`✅ 備份成功!\n\n你的備份碼: ${result.userId}\n\n請妥善保管此備份碼，換電腦時需要用它來還原資料。`);
  } else {
    alert(`❌ 備份失敗: ${result.error}`);
  }
  
  btn.textContent = originalText;
  btn.disabled = false;
});

// 還原按鈕
document.getElementById('restoreBtn').addEventListener('click', async function() {
  const userId = prompt('請輸入你的備份碼:\n(如果是在同一台電腦，可以留空)');
  
  if (userId === null) return; // 使用者取消
  
  if (!confirm('⚠️ 還原將會覆蓋目前的所有備註，確定要繼續嗎?')) {
    return;
  }
  
  const btn = this;
  const originalText = btn.textContent;
  
  btn.textContent = '⏳ 還原中...';
  btn.disabled = true;
  
  const result = await restoreFromCloud(userId || undefined);
  
  if (result.success) {
    const date = new Date(result.timestamp);
    alert(`✅ 還原成功!\n\n備份時間: ${date.toLocaleString('zh-TW')}`);
    loadAllNotes(); // 重新載入管理頁面
  } else {
    alert(`❌ 還原失敗: ${result.error}`);
  }
  
  btn.textContent = originalText;
  btn.disabled = false;
});

// 檢查備份按鈕
document.getElementById('checkBackupBtn').addEventListener('click', async function() {
  const btn = this;
  const originalText = btn.textContent;
  
  btn.textContent = '⏳ 檢查中...';
  btn.disabled = true;
  
  const result = await checkBackup();
  
  if (result.exists) {
    const date = new Date(result.timestamp);
    alert(`✅ 找到備份!\n\n備份碼: ${result.userId}\n備份時間: ${date.toLocaleString('zh-TW')}`);
  } else {
    alert('ℹ️ 目前沒有備份資料');
  }
  
  btn.textContent = originalText;
  btn.disabled = false;
});