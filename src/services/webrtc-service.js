// 這個檔案將在服務器端處理 WebRTC 信令
const socketIo = require('socket.io');

class WebRTCService {
  constructor(server) {
    this.io = socketIo(server);
    this.setupSignaling();
  }

  setupSignaling() {
    this.io.on('connection', (socket) => {
      console.log('用戶連接: ', socket.id);
      
      // 加入特定房間
      socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);
        
        socket.on('disconnect', () => {
          socket.to(roomId).emit('user-disconnected', userId);
        });
      });
      
      // 處理呼叫請求
      socket.on('call-user', (data) => {
        this.io.to(data.userToCall).emit('incoming-call', {
          signal: data.signalData,
          from: data.from,
          name: data.name
        });
      });
      
      // 處理呼叫接受
      socket.on('accept-call', (data) => {
        this.io.to(data.to).emit('call-accepted', data.signal);
      });
    });
  }
}

module.exports = WebRTCService;