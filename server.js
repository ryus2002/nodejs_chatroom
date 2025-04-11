const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const redis = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

// 導入自定義服務
const chatBotService = require('./src/services/chatbot-service');
const WebRTCService = require('./src/services/webrtc-service');

// 創建 Express 應用
const app = express();
const server = http.createServer(app);

// 配置 Socket.IO，明確設置傳輸方式
const io = new Server(server, {
  cors: {
    origin: "*",  // 允許所有來源，生產環境中應限制
    methods: ["GET", "POST"]
  },
  transports: ['polling', 'websocket'],  // 支持長輪詢和 WebSocket
  allowEIO3: true,  // 允許 Engine.IO v3 客戶端連接
  pingTimeout: 60000,  // 增加 ping 超時時間
  pingInterval: 25000  // 增加 ping 間隔
});

// 設置靜態文件
app.use(express.static(path.join(__dirname, 'public')));

// 主頁路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 連接到 MongoDB (使用 Docker 服務名稱)
mongoose.connect('mongodb://mongo:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('已連接到 MongoDB');
}).catch(err => {
  console.error('MongoDB 連接錯誤:', err);
});

// 設置 Redis 適配器 (使用 Docker 服務名稱)
let pubClient, subClient;
try {
  pubClient = redis.createClient({ url: 'redis://redis:6379' });
  subClient = pubClient.duplicate();
  
  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('已連接到 Redis 適配器');
  }).catch(err => {
    console.error('Redis 連接錯誤:', err);
    console.log('使用內存適配器作為後備');
  });
} catch (error) {
  console.error('Redis 客戶端創建失敗:', error);
  console.log('使用內存適配器作為後備');
}

// 處理聊天訊息
io.on('connection', (socket) => {
  console.log('用戶連接:', socket.id);
  
  // 處理加入聊天室
  socket.on('join', (data) => {
    try {
      socket.join(data.room);
      socket.to(data.room).emit('user joined', {
        username: data.username,
        userId: socket.id
      });
      console.log(`用戶 ${data.username} (${socket.id}) 加入了房間 ${data.room}`);
      
      // 保存用戶數據到 socket 對象
      socket.userData = {
        username: data.username,
        room: data.room
      };
    } catch (error) {
      console.error('加入房間錯誤:', error);
    }
  });
  
  // 獲取在線用戶列表
  socket.on('get online users', (data) => {
    try {
      const room = data.room;
      const sockets = io.sockets.adapter.rooms.get(room);
      
      if (!sockets) {
        socket.emit('online users', { users: [] });
        return;
      }
      
      // 獲取房間內所有用戶
      const users = [];
      for (const socketId of sockets) {
        const clientSocket = io.sockets.sockets.get(socketId);
        if (clientSocket && clientSocket.userData) {
          users.push({
            id: socketId,
            username: clientSocket.userData.username
          });
        }
      }
      
      socket.emit('online users', { users });
    } catch (error) {
      console.error('獲取在線用戶錯誤:', error);
      socket.emit('online users', { users: [] });
    }
  });
  
  // 處理聊天訊息
  socket.on('chat message', async (msg) => {
    try {
      // 獲取用戶所在房間
      const room = socket.userData ? socket.userData.room : 
                  Array.from(socket.rooms)[1]; // 備用方法獲取房間
      
      if (!room) {
        console.error('無法確定用戶所在房間');
        return;
      }
      
      console.log(`收到來自 ${msg.sender} 的訊息，房間: ${room}`);
      
      // 廣播訊息給房間內所有人（除了發送者）
      socket.to(room).emit('chat message', msg);
      
      // 檢查是否是機器人指令
      let originalContent = msg.content;
      
      // 如果訊息是加密的，嘗試解密
      if (msg.encrypted) {
        console.log('收到加密訊息，無法檢查是否為機器人指令');
        // 由於我們無法在服務器端解密訊息，因此無法處理加密的機器人指令
        // 這是一個限制，我們可以在前端處理機器人指令
      } else {
        // 如果訊息未加密，直接處理機器人指令
        if (originalContent && originalContent.startsWith('@bot')) {
          console.log('檢測到機器人指令:', originalContent);
          
          try {
            const botResponse = await chatBotService.processMessage(originalContent);
            console.log('機器人回應:', botResponse);
            
            if (botResponse) {
              // 發送機器人回應給所有人（包括發送者）
              io.to(room).emit('chat message', {
                content: botResponse.answer,
                sender: 'ChatBot',
                timestamp: new Date(),
                encrypted: false
              });
            }
          } catch (error) {
            console.error('處理機器人指令錯誤:', error);
          }
        }
      }
    } catch (error) {
      console.error('處理聊天訊息錯誤:', error);
    }
  });
  
  // 處理通話請求
  socket.on('call user', (data) => {
    try {
      io.to(data.userToCall).emit('incoming call', {
        signal: data.signalData,
        from: socket.id,
        name: data.name
      });
    } catch (error) {
      console.error('處理通話請求錯誤:', error);
    }
  });
  
  // 處理接受通話
  socket.on('answer call', (data) => {
    try {
      io.to(data.to).emit('call accepted', data.signal);
    } catch (error) {
      console.error('處理接受通話錯誤:', error);
    }
  });
  
  // 處理拒絕通話
  socket.on('call rejected', (data) => {
    try {
      io.to(data.to).emit('call rejected', {
        reason: data.reason
      });
    } catch (error) {
      console.error('處理拒絕通話錯誤:', error);
    }
  });
  
  // 處理結束通話
  socket.on('end call', (data) => {
    try {
      io.to(data.to).emit('call ended');
    } catch (error) {
      console.error('處理結束通話錯誤:', error);
    }
  });
  
  // 處理斷開連接
  socket.on('disconnect', () => {
    try {
      console.log('用戶斷開連接:', socket.id);
      
      // 通知該用戶所在的所有房間
      if (socket.userData && socket.userData.room) {
        socket.to(socket.userData.room).emit('user left', {
          username: socket.userData.username,
          userId: socket.id
        });
      }
    } catch (error) {
      console.error('處理斷開連接錯誤:', error);
    }
  });
});

// 啟動服務器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服務器運行在 http://localhost:${PORT}`);
});