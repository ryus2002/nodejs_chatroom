const CryptoJS = require('crypto-js');

class EncryptionService {
  constructor() {
    // 在實際應用中，應從安全的環境變數或密鑰管理服務獲取
    this.defaultKey = process.env.ENCRYPTION_KEY || 'default-secure-key';
  }

  // 加密訊息
  encrypt(message, key = this.defaultKey) {
    return CryptoJS.AES.encrypt(message, key).toString();
  }

  // 解密訊息
  decrypt(encryptedMessage, key = this.defaultKey) {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // 生成隨機金鑰
  generateKey(length = 32) {
    return CryptoJS.lib.WordArray.random(length).toString();
  }
}

module.exports = new EncryptionService();