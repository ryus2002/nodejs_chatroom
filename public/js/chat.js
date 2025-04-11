/**
 * 聊天室主要功能
 * 處理用戶加入、發送訊息和接收訊息等功能
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('初始化聊天功能...');
  
  // 獲取DOM元素
  const joinForm = document.getElementById('join-form');
  const roomSelection = document.getElementById('room-selection');
  const chatArea = document.getElementById('chat-area');
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  const messagesContainer = document.getElementById('messages');
  const usernameDisplay = document.getElementById('username-display');
  const generateKeyBtn = document.getElementById('generate-key');
  const encryptionKeyInput = document.getElementById('encryption-key');
  
  // 確認DOM元素已正確獲取
  if (!joinForm || !roomSelection || !chatArea || !messageForm || !messageInput || !messagesContainer) {
    console.error('無法找到必要的DOM元素');
    alert('頁面載入錯誤，請重新整理頁面');
    return;
  }
  
  // 連接到Socket.io伺服器
  console.log('連接到Socket.io伺服器...');
  const socket = io();
  
  // 確認Socket.io連接
  socket.on('connect', () => {
    console.log('已連接到Socket.io伺服器，ID:', socket.id);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket.io連接錯誤:', error);
    alert('無法連接到聊天伺服器，請檢查您的網絡連接');
  });
  
  // 用戶資訊
  let username = '';
  let currentRoom = '';
  
  // 初始化加密金鑰生成按鈕
  generateKeyBtn.addEventListener('click', () => {
    try {
      const randomKey = encryptionClient.generateKey();
      encryptionKeyInput.value = randomKey;
      alert(`已生成隨機金鑰: ${randomKey}\n請保存此金鑰，並分享給您想要私密聊天的對象。`);
    } catch (error) {
      console.error('生成金鑰錯誤:', error);
      alert('無法生成加密金鑰，請確保頁面已正確載入所有腳本');
    }
  });
  
  // 處理加入聊天室表單提交
  joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // 獲取用戶輸入
    username = document.getElementById('username').value.trim();
    currentRoom = document.getElementById('room').value;
    const encryptionKey = encryptionKeyInput.value.trim() || 'default-secure-key';
    
    if (!username) return alert('請輸入您的名稱');
    
    console.log('加入聊天室:', currentRoom, '，用戶名:', username);
    
    try {
      // 初始化加密服務
      encryptionClient.initialize(encryptionKey);
      console.log('加密服務已初始化，金鑰長度:', encryptionKey.length);
      
      // 加入聊天室
      socket.emit('join', {
        username,
        room: currentRoom
      });
      
      // 顯示聊天區域
      roomSelection.style.display = 'none';
      chatArea.style.display = 'flex';
      usernameDisplay.textContent = username;
      
      // 顯示系統訊息
      addMessage({
        content: `歡迎來到 ${getRoomDisplayName(currentRoom)} 聊天室！`,
        sender: 'System',
        timestamp: new Date()
      }, 'system');
      
      // 提示用戶可用的機器人指令
      addMessage({
        content: '您可以使用 @bot 指令與聊天機器人互動，例如 "@bot 幫助"',
        sender: 'System',
        timestamp: new Date()
      }, 'system');
    } catch (error) {
      console.error('加入聊天室錯誤:', error);
      alert('加入聊天室時發生錯誤，請重新整理頁面後再試');
    }
  });
  
  // 處理發送訊息
  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    console.log('發送訊息:', message);
    
    try {
      // 檢查是否是機器人指令
      const isBotCommand = message.startsWith('@bot');
      
      // 如果是機器人指令，不加密
      let encryptedContent = message;
      let shouldEncrypt = encryptionClient.isEncryptionEnabled && !isBotCommand;
      
      if (shouldEncrypt) {
        encryptedContent = encryptionClient.encrypt(message);
        console.log('訊息已加密');
      } else if (isBotCommand) {
        console.log('機器人指令不加密');
      }
      
      // 發送訊息
      socket.emit('chat message', {
        content: encryptedContent,
        sender: username,
        timestamp: new Date(),
        encrypted: shouldEncrypt
      });
      
      // 顯示自己發送的訊息（立即顯示，不等待服務器回應）
      addMessage({
        content: message, // 顯示原始訊息，不是加密後的
        sender: username,
        timestamp: new Date()
      }, 'self');
      
      // 清空輸入框
      messageInput.value = '';
    } catch (error) {
      console.error('發送訊息錯誤:', error);
      alert('發送訊息失敗，請重試');
    }
  });
  
  // 接收訊息
  socket.on('chat message', (msg) => {
    console.log('收到訊息:', msg);
    
    // 如果是自己發送的訊息，不再顯示（因為已經在發送時顯示了）
    if (msg.sender === username) {
      console.log('跳過顯示自己發送的訊息');
      return;
    }
    
    // 處理訊息解密
    if (msg.encrypted) {
      try {
        console.log('嘗試解密訊息');
        msg.content = encryptionClient.decrypt(msg.content);
        console.log('訊息解密成功');
      } catch (error) {
        console.error('解密訊息失敗:', error);
        msg.content = '(無法解密的訊息，可能使用了不同的金鑰)';
      }
    }
    
    // 顯示訊息
    const messageType = msg.sender === 'ChatBot' ? 'bot' : 
                        msg.sender === 'System' ? 'system' : 'other';
    addMessage(msg, messageType);
  });
  
  // 處理用戶加入
  socket.on('user joined', (data) => {
    console.log('用戶加入:', data);
    addMessage({
      content: `${data.username} 加入了聊天室`,
      sender: 'System',
      timestamp: new Date()
    }, 'system');
  });
  
  // 處理用戶離開
  socket.on('user left', (data) => {
    console.log('用戶離開:', data);
    addMessage({
      content: `${data.username} 離開了聊天室`,
      sender: 'System',
      timestamp: new Date()
    }, 'system');
  });
  
  // 添加訊息到聊天區域
  function addMessage(msg, type = 'other') {
    console.log('添加訊息到界面:', type, msg);
    
    try {
      const messageElement = document.createElement('div');
      messageElement.className = `message ${type}`;
      
      // 格式化時間
      const time = new Date(msg.timestamp).toLocaleTimeString();
      
      // 根據訊息類型設置不同的HTML結構
      if (type === 'system') {
        messageElement.innerHTML = `
          <div class="system-message">${msg.content}</div>
          <span class="timestamp">${time}</span>
        `;
      } else if (type === 'bot') {
        messageElement.innerHTML = `
          <span class="sender">🤖 ${msg.sender}:</span>
          <span class="content">${msg.content}</span>
          <span class="timestamp">${time}</span>
        `;
      } else {
        messageElement.innerHTML = `
          <span class="sender">${msg.sender}:</span>
          <span class="content">${msg.content}</span>
          <span class="timestamp">${time}</span>
        `;
      }
      
      // 添加到訊息容器
      messagesContainer.appendChild(messageElement);
      
      // 滾動到最新訊息
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      console.log('訊息已添加到界面');
    } catch (error) {
      console.error('添加訊息到界面錯誤:', error);
    }
  }
  
  // 獲取房間顯示名稱
  function getRoomDisplayName(roomId) {
    const rooms = {
      'general': '一般',
      'tech': '技術討論',
      'random': '隨意聊天'
    };
    return rooms[roomId] || roomId;
  }
  
  console.log('聊天功能初始化完成');
});