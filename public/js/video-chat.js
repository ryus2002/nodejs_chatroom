/**
 * 視訊聊天功能
 * 使用 WebRTC 實現點對點視訊通話
 */
document.addEventListener('DOMContentLoaded', () => {
  // 獲取DOM元素
  const videoCallBtn = document.getElementById('video-call-btn');
  const videoChat = document.getElementById('video-chat');
  const localVideo = document.getElementById('local-video');
  const remoteVideo = document.getElementById('remote-video');
  const endCallBtn = document.getElementById('end-call');
  const remoteUserName = document.getElementById('remote-user-name');
  
  // 全局變數
  let localStream = null;
  let peer = null;
  let currentCall = null;
  let isInCall = false;
  let currentRoom = null; // 添加當前房間變量
  
  // 獲取 Socket.io 實例
  const socket = io();
  
  // STUN 伺服器配置
  const peerConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };
  
  // 從 chat.js 獲取當前房間信息
  function getCurrentRoomFromChat() {
    // 如果 window.chatApp 存在且定義了 currentRoom
    if (window.chatApp && window.chatApp.currentRoom) {
      return window.chatApp.currentRoom;
    }
    
    // 否則從 localStorage 嘗試獲取
    const storedRoom = localStorage.getItem('currentRoom');
    if (storedRoom) {
      return storedRoom;
    }
    
    // 默認返回 'general'
    return 'general';
  }
  
  // 初始化視訊通話按鈕
  videoCallBtn.addEventListener('click', () => {
    if (isInCall) {
      alert('您已經在通話中');
      return;
    }
    
    // 獲取當前房間
    currentRoom = getCurrentRoomFromChat();
    console.log('嘗試在房間獲取在線用戶:', currentRoom);
    
    // 獲取在線用戶列表
    socket.emit('get online users', {
      room: currentRoom
    });
  });
  
  // 處理在線用戶列表
  socket.on('online users', (data) => {
    if (!data.users || data.users.length <= 1) {
      alert('目前沒有其他用戶在線');
      return;
    }
    
    // 創建用戶選擇對話框
    const userList = data.users.filter(user => user.id !== socket.id);
    const userSelect = document.createElement('select');
    userSelect.id = 'user-select';
    
    userList.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = user.username;
      userSelect.appendChild(option);
    });
    
    // 創建對話框
    const dialog = document.createElement('div');
    dialog.className = 'call-dialog';
    dialog.innerHTML = `
      <h3>選擇要通話的用戶</h3>
      <div class="dialog-content"></div>
      <div class="dialog-buttons">
        <button id="call-btn">開始通話</button>
        <button id="cancel-btn">取消</button>
      </div>
    `;
    
    dialog.querySelector('.dialog-content').appendChild(userSelect);
    document.body.appendChild(dialog);
    
    // 處理通話按鈕點擊
    dialog.querySelector('#call-btn').addEventListener('click', () => {
      const selectedUserId = userSelect.value;
      const selectedUsername = userSelect.options[userSelect.selectedIndex].textContent;
      startCall(selectedUserId, selectedUsername);
      document.body.removeChild(dialog);
    });
    
    // 處理取消按鈕點擊
    dialog.querySelector('#cancel-btn').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
  });
  
  // 開始通話
  async function startCall(userId, username) {
    try {
      // 獲取本地媒體流
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      // 顯示本地視訊
      localVideo.srcObject = localStream;
      
      // 創建對等連接
      peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: localStream,
        config: peerConfig
      });
      
      // 處理信令
      peer.on('signal', signal => {
        socket.emit('call user', {
          userToCall: userId,
          signalData: signal,
          from: socket.id,
          name: username
        });
      });
      
      // 處理視訊流
      peer.on('stream', stream => {
        remoteVideo.srcObject = stream;
        remoteUserName.textContent = username;
      });
      
      // 顯示視訊聊天區域
      videoChat.style.display = 'block';
      isInCall = true;
      currentCall = {
        userId,
        username
      };
      
    } catch (err) {
      console.error('無法獲取媒體設備:', err);
      alert('無法啟動攝影機或麥克風，請確認您已授予權限。');
    }
  }
  
  // 處理來電
  socket.on('incoming call', async (data) => {
    if (isInCall) {
      // 如果已經在通話中，拒絕來電
      socket.emit('call rejected', {
        to: data.from,
        reason: 'busy'
      });
      return;
    }
    
    // 顯示來電提示
    const callConfirm = confirm(`${data.name} 想要與您進行視訊通話。接受?`);
    
    if (callConfirm) {
      try {
        // 獲取本地媒體流
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        // 顯示本地視訊
        localVideo.srcObject = localStream;
        
        // 創建對等連接
        peer = new SimplePeer({
          initiator: false,
          trickle: false,
          stream: localStream,
          config: peerConfig
        });
        
        // 處理信令
        peer.on('signal', signal => {
          socket.emit('answer call', {
            signal,
            to: data.from
          });
        });
        
        // 處理視訊流
        peer.on('stream', stream => {
          remoteVideo.srcObject = stream;
          remoteUserName.textContent = data.name;
        });
        
        // 處理收到的信令
        peer.signal(data.signal);
        
        // 顯示視訊聊天區域
        videoChat.style.display = 'block';
        isInCall = true;
        currentCall = {
          userId: data.from,
          username: data.name
        };
        
      } catch (err) {
        console.error('無法獲取媒體設備:', err);
        alert('無法啟動攝影機或麥克風，請確認您已授予權限。');
        
        socket.emit('call rejected', {
          to: data.from,
          reason: 'media'
        });
      }
    } else {
      // 拒絕通話
      socket.emit('call rejected', {
        to: data.from,
        reason: 'rejected'
      });
    }
  });
  
  // 處理通話被接受
  socket.on('call accepted', signal => {
    peer.signal(signal);
  });
  
  // 處理通話被拒絕
  socket.on('call rejected', data => {
    let message = '對方拒絕了您的通話請求';
    if (data.reason === 'busy') {
      message = '對方正在通話中';
    } else if (data.reason === 'media') {
      message = '對方無法啟動攝影機或麥克風';
    }
    alert(message);
    endCall();
  });
  
  // 處理通話結束
  socket.on('call ended', () => {
    alert('對方結束了通話');
    endCall();
  });
  
  // 結束通話按鈕
  endCallBtn.addEventListener('click', () => {
    if (currentCall) {
      socket.emit('end call', {
        to: currentCall.userId
      });
    }
    endCall();
  });
  
  // 結束通話功能
  function endCall() {
    if (peer) {
      peer.destroy();
      peer = null;
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    
    // 清理視訊元素
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    
    // 隱藏視訊聊天區域
    videoChat.style.display = 'none';
    isInCall = false;
    currentCall = null;
  }
  
  // 當頁面關閉時結束通話
  window.addEventListener('beforeunload', () => {
    if (isInCall && currentCall) {
      socket.emit('end call', {
        to: currentCall.userId
      });
      endCall();
    }
  });
});