/**
 * 前端加密服務
 * 負責處理訊息的加密和解密功能
 */
class EncryptionClient {
  constructor() {
    this.encryptionKey = null;
    this.isEncryptionEnabled = true;
  }

  /**
   * 初始化加密服務
   * @param {string} key - 加密金鑰
   */
  initialize(key) {
    this.encryptionKey = key || 'default-secure-key';
    this.updateEncryptionStatus(true);
    console.log('加密服務已初始化');
  }

  /**
   * 加密訊息
   * @param {string} message - 要加密的訊息
   * @returns {string} - 加密後的訊息
   */
  encrypt(message) {
    if (!this.isEncryptionEnabled || !message) return message;
    try {
      return CryptoJS.AES.encrypt(message, this.encryptionKey).toString();
    } catch (error) {
      console.error('加密失敗:', error);
      return message;
    }
  }

  /**
   * 解密訊息
   * @param {string} encryptedMessage - 要解密的訊息
   * @returns {string} - 解密後的訊息
   */
  decrypt(encryptedMessage) {
    if (!this.isEncryptionEnabled || !encryptedMessage) return encryptedMessage;
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('解密失敗:', error);
      return '無法解密訊息 (可能使用了不同的金鑰)';
    }
  }

  /**
   * 生成隨機金鑰
   * @param {number} length - 金鑰長度
   * @returns {string} - 隨機金鑰
   */
  generateKey(length = 16) {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  /**
   * 切換加密狀態
   * @param {boolean} isEnabled - 是否啟用加密
   */
  toggleEncryption(isEnabled) {
    this.isEncryptionEnabled = isEnabled;
    this.updateEncryptionStatus(isEnabled);
  }

  /**
   * 更新加密狀態顯示
   * @param {boolean} isEnabled - 是否啟用加密
   */
  updateEncryptionStatus(isEnabled) {
    const statusIcon = document.getElementById('encryption-status-icon');
    const statusText = document.getElementById('encryption-status-text');
    
    if (statusIcon && statusText) {
      if (isEnabled) {
        statusIcon.textContent = '🔒';
        statusText.textContent = '端到端加密已啟用';
        statusText.style.color = '#28a745';
      } else {
        statusIcon.textContent = '🔓';
        statusText.textContent = '加密已停用';
        statusText.style.color = '#dc3545';
      }
    }
  }
}

// 創建全局加密客戶端實例
const encryptionClient = new EncryptionClient();