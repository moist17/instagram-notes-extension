// Instagram 追蹤備註擴充功能
(function() {
    'use strict';
  
    console.log('Instagram 追蹤備註擴充功能已載入');
  
    let currentUsername = '';
    let noteContainer = null;
    let checkInterval = null;
  
    // 初始化
    function init() {
      console.log('Instagram 備註工具：開始初始化');
      // 使用定期檢查而非 MutationObserver
      checkInterval = setInterval(checkAndAddNote, 2000);
      
      // 立即執行一次
      setTimeout(checkAndAddNote, 1500);
    }
  
    // 取得當前使用者名稱
    function getCurrentUsername() {
      const match = window.location.pathname.match(/^\/([^\/]+)\/?$/);
      if (!match || match[1] === 'explore' || match[1] === 'reels' || match[1] === 'accounts') {
        return null;
      }
      return match[1];
    }
  
    // 檢查並新增備註區域
    function checkAndAddNote() {
      const username = getCurrentUsername();
      
      console.log('檢查頁面，當前使用者名稱:', username);
      
      // 如果不在個人檔案頁面，移除備註容器
      if (!username) {
        if (noteContainer) {
          noteContainer.remove();
          noteContainer = null;
          currentUsername = '';
        }
        return;
      }
  
      // 如果已經有相同使用者的備註容器，不重複新增
      if (username === currentUsername && noteContainer && document.contains(noteContainer)) {
        return;
      }
  
      currentUsername = username;
  
      // 尋找插入位置 - Instagram 的個人檔案結構
      const targetElement = findInsertionPoint();
      
      if (!targetElement) {
        return;
      }
  
      // 如果已存在舊的備註容器，先移除
      if (noteContainer && document.contains(noteContainer)) {
        noteContainer.remove();
      }
  
      // 建立新的備註容器
      createNoteContainer(targetElement, username);
    }
  
    // 尋找合適的插入位置
    function findInsertionPoint() {
      console.log('開始尋找插入位置...');
      
      // 方法1：尋找包含個人資料統計的 ul 元素（最精確）
      // Instagram 的貼文數、粉絲數通常在一個 ul > li 結構中
      const statLists = document.querySelectorAll('ul');
      for (let ul of statLists) {
        const text = ul.textContent;
        // 檢查是否包含「貼文」和「粉絲」或英文版本
        if ((text.includes('貼文') || text.includes('posts')) && 
            (text.includes('粉絲') || text.includes('followers'))) {
          console.log('找到插入點：統計資訊的 ul 元素');
          // 找到這個 ul 的最外層容器（通常是 header 的子元素）
          let container = ul;
          // 向上找到 header 的直接子元素
          while (container.parentElement && 
                 container.parentElement.tagName !== 'HEADER' && 
                 container.parentElement.tagName !== 'MAIN') {
            container = container.parentElement;
          }
          return container;
        }
      }
  
      // 方法2：尋找 header 元素內的最後一個主要 section
      const header = document.querySelector('header');
      if (header) {
        // 找 header 內所有的 section
        const sections = header.querySelectorAll('section');
        if (sections.length > 0) {
          // 返回最後一個 section 的父容器
          const lastSection = sections[sections.length - 1];
          console.log('找到插入點：header 內的最後一個 section');
          let container = lastSection;
          while (container.parentElement && container.parentElement !== header) {
            container = container.parentElement;
          }
          return container;
        }
        
        // 如果沒有 section，就用 header 的第一個子元素
        console.log('找到插入點：header 的第一個子元素');
        return header.children[0];
      }
  
      // 方法3：使用 main 標籤
      const main = document.querySelector('main');
      if (main && main.children.length > 0) {
        console.log('找到插入點：main 的第一個子元素');
        return main.children[0];
      }
  
      console.log('找不到合適的插入點');
      return null;
    }
  
    // 建立備註容器
    function createNoteContainer(targetElement, username) {
      noteContainer = document.createElement('div');
      noteContainer.className = 'ig-note-container';
      noteContainer.setAttribute('data-username', username);
      
      const noteId = `note-${username}`;
      
      noteContainer.innerHTML = `
        <div class="ig-note-header">
          <span class="ig-note-icon">📝</span>
          <span class="ig-note-title">我的追蹤備註</span>
        </div>
        <div class="ig-note-content">
          <div class="ig-note-tags-section">
            <label class="ig-note-label">標籤：</label>
            <div id="${noteId}-tags" class="ig-note-tags"></div>
            <button class="ig-note-add-tag-btn" id="${noteId}-add-tag">+ 新增標籤</button>
          </div>
          <div class="ig-note-text-section">
            <label class="ig-note-label">備註：</label>
            <textarea 
              id="${noteId}" 
              class="ig-note-textarea" 
              placeholder="為什麼追蹤 @${username}？寫下你的備註..."
              rows="3"
            ></textarea>
          </div>
          <div class="ig-note-actions">
            <button class="ig-note-save" type="button">💾 儲存</button>
            <button class="ig-note-delete" type="button">🗑️ 清除</button>
          </div>
          <div class="ig-note-status"></div>
        </div>
      `;
  
      // 插入到頁面中（確保插入在頂部可見區域）
      const parent = targetElement.parentNode;
      if (!parent) {
        console.log('錯誤：找不到父節點');
        return;
      }
      
      // 插入在目標元素的正下方
      if (targetElement.nextSibling) {
        parent.insertBefore(noteContainer, targetElement.nextSibling);
      } else {
        parent.appendChild(noteContainer);
      }
      
      console.log('備註區塊已成功插入頁面');
  
      // 設定事件監聽
      setupEventListeners(username);
      
      // 載入備註
      loadNote(username);
    }
  
    // 設定事件監聽器
    function setupEventListeners(username) {
      const textarea = noteContainer.querySelector('.ig-note-textarea');
      const saveBtn = noteContainer.querySelector('.ig-note-save');
      const deleteBtn = noteContainer.querySelector('.ig-note-delete');
      const statusDiv = noteContainer.querySelector('.ig-note-status');
      const addTagBtn = noteContainer.querySelector('.ig-note-add-tag-btn');
      const tagsContainer = noteContainer.querySelector('.ig-note-tags');
  
      console.log('設定事件監聽器，addTagBtn:', addTagBtn);
  
      // 載入並顯示標籤
      loadAndDisplayTags(username, tagsContainer);
  
      // 新增標籤按鈕 - 使用 addEventListener 而非 onclick
      if (addTagBtn) {
        // 移除可能存在的舊監聽器
        const newAddTagBtn = addTagBtn.cloneNode(true);
        addTagBtn.parentNode.replaceChild(newAddTagBtn, addTagBtn);
        
        newAddTagBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('點擊新增標籤按鈕！');
          showTagSelector(username, tagsContainer);
        }, true);
        
        console.log('已綁定新增標籤按鈕的點擊事件');
      } else {
        console.error('找不到新增標籤按鈕！');
      }
  
      if (saveBtn) {
        saveBtn.onclick = function(e) {
          e.preventDefault();
          const note = textarea.value.trim();
          const selectedTags = getSelectedTags(tagsContainer);
          saveNote(username, note, selectedTags);
          showStatus(statusDiv, '✅ 已儲存', 'success');
        };
      }
  
      if (deleteBtn) {
        deleteBtn.onclick = function(e) {
          e.preventDefault();
          const confirmDelete = window.confirm('確定要清除這則備註嗎？');
          if (confirmDelete) {
            textarea.value = '';
            saveNote(username, '', []);
            // 清空標籤顯示
            tagsContainer.innerHTML = '';
            showStatus(statusDiv, '🗑️ 已清除', 'success');
          }
        };
      }
    }
  
    // 載入並顯示標籤
    function loadAndDisplayTags(username, tagsContainer) {
      const key = `ig_note_tags_${username}`;
      chrome.storage.local.get([key], function(result) {
        const tags = result[key] || [];
        displayTags(tags, tagsContainer, username);
      });
    }
  
    // 顯示標籤
    function displayTags(tags, tagsContainer, username) {
      tagsContainer.innerHTML = tags.map(tag => `
        <span class="ig-note-tag" data-tag="${tag}">
          ${tag}
          <button class="ig-note-tag-remove" onclick="window.removeTag('${username}', '${tag}')">×</button>
        </span>
      `).join('');
    }
  
    // 取得已選標籤
    function getSelectedTags(tagsContainer) {
      const tagElements = tagsContainer.querySelectorAll('.ig-note-tag');
      return Array.from(tagElements).map(el => el.dataset.tag);
    }
  
    // 顯示標籤選擇器
    function showTagSelector(username, tagsContainer) {
      // 預設標籤（不可刪除）
      const defaultTags = [
        '🎨 創作者',
        '📷 攝影師', 
        '💼 工作',
        '👥 朋友',
        '📚 學習',
        '🎭 娛樂',
        '🛍️ 品牌',
        '⭐ 靈感'
      ];
  
      // 取得現有標籤
      const currentTags = getSelectedTags(tagsContainer);
  
      // 載入自訂標籤
      chrome.storage.local.get(['custom_tags'], function(result) {
        const customTags = result.custom_tags || [];
        const allTags = [...defaultTags, ...customTags];
  
        // 建立選擇器 UI
        const selector = document.createElement('div');
        selector.className = 'ig-note-tag-selector';
        selector.innerHTML = `
          <div class="ig-note-tag-selector-header">
            <span>選擇標籤</span>
            <button class="ig-note-tag-selector-close">×</button>
          </div>
          <div class="ig-note-tag-list">
            ${defaultTags.map(tag => `
              <button class="ig-note-tag-option ${currentTags.includes(tag) ? 'selected' : ''}" 
                      data-tag="${tag}"
                      data-is-default="true">
                ${tag}
              </button>
            `).join('')}
            ${customTags.map(tag => `
              <div class="ig-note-tag-option-wrapper">
                <button class="ig-note-tag-option ${currentTags.includes(tag) ? 'selected' : ''}" 
                        data-tag="${tag}"
                        data-is-default="false">
                  ${tag}
                </button>
                <button class="ig-note-tag-delete" data-tag="${tag}" title="永久刪除此標籤">🗑️</button>
              </div>
            `).join('')}
          </div>
          <div class="ig-note-tag-custom">
            <input type="text" placeholder="輸入自訂標籤..." class="ig-note-tag-input">
            <button class="ig-note-tag-add">新增</button>
          </div>
        `;
  
        // 插入選擇器
        noteContainer.appendChild(selector);
  
        // 標籤選項點擊
        selector.querySelectorAll('.ig-note-tag-option').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('selected');
          });
        });
  
        // 刪除自訂標籤
        selector.querySelectorAll('.ig-note-tag-delete').forEach(btn => {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const tagToDelete = this.dataset.tag;
            
            if (confirm(`確定要永久刪除標籤「${tagToDelete}」嗎？\n\n這會從所有帳號中移除此標籤。`)) {
              // 從自訂標籤列表中刪除
              const updatedCustomTags = customTags.filter(t => t !== tagToDelete);
              chrome.storage.local.set({ custom_tags: updatedCustomTags });
              
              // 從所有帳號的標籤中移除
              chrome.storage.local.get(null, function(allData) {
                const updates = {};
                for (let key in allData) {
                  if (key.startsWith('ig_note_tags_')) {
                    const tags = allData[key];
                    if (Array.isArray(tags) && tags.includes(tagToDelete)) {
                      updates[key] = tags.filter(t => t !== tagToDelete);
                    }
                  }
                }
                if (Object.keys(updates).length > 0) {
                  chrome.storage.local.set(updates);
                }
              });
              
              // 移除這個標籤的 DOM 元素
              this.parentElement.remove();
              
              console.log('已永久刪除標籤:', tagToDelete);
            }
          });
        });
  
        // 新增自訂標籤
        const addCustomBtn = selector.querySelector('.ig-note-tag-add');
        const customInput = selector.querySelector('.ig-note-tag-input');
        
        const addCustomTag = function() {
          const newTag = customInput.value.trim();
          if (newTag) {
            // 檢查是否已存在
            if (allTags.includes(newTag)) {
              alert('此標籤已存在！');
              return;
            }
            
            // 儲存到自訂標籤
            customTags.push(newTag);
            chrome.storage.local.set({ custom_tags: customTags });
            
            // 加入選項
            const tagList = selector.querySelector('.ig-note-tag-list');
            const wrapper = document.createElement('div');
            wrapper.className = 'ig-note-tag-option-wrapper';
            wrapper.innerHTML = `
              <button class="ig-note-tag-option selected" data-tag="${newTag}" data-is-default="false">
                ${newTag}
              </button>
              <button class="ig-note-tag-delete" data-tag="${newTag}" title="永久刪除此標籤">🗑️</button>
            `;
            tagList.appendChild(wrapper);
            
            // 綁定新按鈕的事件
            const newBtn = wrapper.querySelector('.ig-note-tag-option');
            newBtn.addEventListener('click', function(e) {
              e.stopPropagation();
              this.classList.toggle('selected');
            });
            
            const deleteBtn = wrapper.querySelector('.ig-note-tag-delete');
            deleteBtn.addEventListener('click', function(e) {
              e.stopPropagation();
              if (confirm(`確定要永久刪除標籤「${newTag}」嗎？`)) {
                const idx = customTags.indexOf(newTag);
                if (idx > -1) customTags.splice(idx, 1);
                chrome.storage.local.set({ custom_tags: customTags });
                wrapper.remove();
              }
            });
            
            customInput.value = '';
            allTags.push(newTag);
          }
        };
        
        addCustomBtn.addEventListener('click', addCustomTag);
        customInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            addCustomTag();
          }
        });
  
        // 關閉並儲存
        selector.querySelector('.ig-note-tag-selector-close').addEventListener('click', function() {
          const selectedTags = Array.from(selector.querySelectorAll('.ig-note-tag-option.selected'))
            .map(btn => btn.dataset.tag);
          
          // 儲存標籤
          const key = `ig_note_tags_${username}`;
          chrome.storage.local.set({ [key]: selectedTags });
          
          // 更新顯示
          displayTags(selectedTags, tagsContainer, username);
          
          // 移除選擇器
          selector.remove();
        });
      });
    }
  
    // 移除標籤（全域函數）
    window.removeTag = function(username, tag) {
      const key = `ig_note_tags_${username}`;
      chrome.storage.local.get([key], function(result) {
        let tags = result[key] || [];
        tags = tags.filter(t => t !== tag);
        chrome.storage.local.set({ [key]: tags });
        
        // 更新顯示
        const tagsContainer = noteContainer.querySelector('.ig-note-tags');
        if (tagsContainer) {
          displayTags(tags, tagsContainer, username);
        }
      });
    };
  
    // 載入備註
    function loadNote(username) {
      const key = `ig_note_${username}`;
      chrome.storage.local.get([key], function(result) {
        const textarea = noteContainer.querySelector('.ig-note-textarea');
        if (result[key] && textarea) {
          textarea.value = result[key];
        }
      });
    }
  
    // 儲存備註
    function saveNote(username, note, tags = []) {
      const key = `ig_note_${username}`;
      const timeKey = `ig_note_time_${username}`;
      const tagsKey = `ig_note_tags_${username}`;
      const data = {};
      data[key] = note;
      data[timeKey] = Date.now();
      data[tagsKey] = tags || [];
      chrome.storage.local.set(data);
    }
  
    // 顯示狀態訊息
    function showStatus(statusDiv, message, type) {
      if (!statusDiv) return;
      
      statusDiv.textContent = message;
      statusDiv.className = `ig-note-status ${type}`;
      statusDiv.style.display = 'block';
      
      setTimeout(function() {
        statusDiv.style.display = 'none';
      }, 2500);
    }
  
    // 清理函數（移除 beforeunload 監聽）
    // Instagram 的安全政策不允許使用 beforeunload
    // 改用其他方式確保程式穩定運行
  
    // 啟動
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        init();
      });
    } else {
      init();
    }
  
  })();