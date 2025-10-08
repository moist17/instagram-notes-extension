// simple-backup.js
// 使用 Chrome Storage Sync 作為簡單的雲端備份

// 產生唯一的備份 ID
function generateBackupId() {
    return 'backup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // 取得備份 ID
  function getBackupId() {
    let backupId = localStorage.getItem('backupId');
    if (!backupId) {
      backupId = generateBackupId();
      localStorage.setItem('backupId', backupId);
    }
    return backupId;
  }
  
  // 備份到雲端 (使用第三方備份服務)
  export async function backupToCloud() {
    try {
      // 讀取所有本地資料
      const allData = await chrome.storage.local.get(null);
      
      // 準備備份資料
      const backupData = {
        data: allData,
        timestamp: Date.now(),
        version: chrome.runtime.getManifest().version
      };
      
      const backupId = getBackupId();
      
      // 使用簡單的第三方備份 API (JSONBin.io)
      const response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': '$2a$10$GuLeGYYEb.b8b/ylsN8JleP.j448qeIgtsMz776KM4ZP0Ff9ScGpq' 
        },
        body: JSON.stringify({
          backupId: backupId,
          backupData: backupData
        })
      });
      
      if (!response.ok) {
        throw new Error('備份請求失敗');
      }
      
      const result = await response.json();
      const recordId = result.metadata.id;
      
      // 儲存 record ID 以便還原
      localStorage.setItem('backupRecordId', recordId);
      
      return { 
        success: true, 
        backupId: backupId,
        recordId: recordId
      };
      
    } catch (error) {
      console.error('備份失敗:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 從雲端還原
  export async function restoreFromCloud(recordId) {
    try {
      if (!recordId) {
        recordId = localStorage.getItem('backupRecordId');
        if (!recordId) {
          return { success: false, error: '找不到備份記錄' };
        }
      }
      
      // 從第三方服務取得備份
      const response = await fetch(`https://api.jsonbin.io/v3/b/${recordId}/latest`, {
        headers: {
          'X-Master-Key': '$2a$10$GuLeGYYEb.b8b/ylsN8JleP.j448qeIgtsMz776KM4ZP0Ff9ScGpq'
        }
      });
      
      if (!response.ok) {
        throw new Error('找不到備份資料');
      }
      
      const result = await response.json();
      const backup = result.record.backupData;
      
      // 還原到本地
      await chrome.storage.local.clear();
      await chrome.storage.local.set(backup.data);
      
      // 儲存 record ID
      localStorage.setItem('backupRecordId', recordId);
      localStorage.setItem('backupId', result.record.backupId);
      
      return { 
        success: true, 
        timestamp: backup.timestamp 
      };
      
    } catch (error) {
      console.error('還原失敗:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 檢查是否有備份
  export async function checkBackup() {
    try {
      const recordId = localStorage.getItem('backupRecordId');
      const backupId = localStorage.getItem('backupId');
      
      if (!recordId) {
        return { exists: false };
      }
      
      const response = await fetch(`https://api.jsonbin.io/v3/b/${recordId}/latest`, {
        headers: {
          'X-Master-Key': '$2a$10$GuLeGYYEb.b8b/ylsN8JleP.j448qeIgtsMz776KM4ZP0Ff9ScGpq'
        }
      });
      
      if (!response.ok) {
        return { exists: false };
      }
      
      const result = await response.json();
      const backup = result.record.backupData;
      
      return {
        exists: true,
        timestamp: backup.timestamp,
        backupId: backupId,
        recordId: recordId
      };
      
    } catch (error) {
      console.error('檢查備份失敗:', error);
      return { exists: false, error: error.message };
    }
  }