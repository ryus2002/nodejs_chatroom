我會為您重新撰寫一個專注於 Docker 執行方式的 README.md 文件，特別針對 Windows 環境。

```markdown
# 即時聊天室應用 (Real-time Chat Application)

這是一個功能豐富的即時聊天應用，具有文字聊天、視訊通話、加密通訊和聊天機器人等進階功能。

## 功能特點

- 💬 即時文字聊天
- 🔐 端對端加密通訊
- 📹 視訊通話功能
- 🤖 智能聊天機器人
- 🏠 多房間支援
- 🌐 可擴展的架構

## 系統需求

### Docker 方式 (推薦)
- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
- 至少 4GB RAM 可用於 Docker
- 啟用 WSL 2 (Windows 10/11)

### 傳統方式
- [Node.js](https://nodejs.org/) (v14 或更高版本)
- [npm](https://www.npmjs.com/) (通常隨 Node.js 一起安裝)
- [MongoDB](https://www.mongodb.com/try/download/community)
- [Redis](https://github.com/microsoftarchive/redis/releases)

## 使用 Docker 執行 (Windows 環境)

### 1. 安裝 Docker Desktop for Windows

1. 前往 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop) 下載安裝程式
2. 依照安裝精靈的指示完成安裝
3. 啟動 Docker Desktop 並等待 Docker 引擎完全啟動
4. 確認安裝成功：在命令提示字元或 PowerShell 中執行
   ```
   docker --version
   docker-compose --version
   ```

### 2. 執行專案

1. 開啟命令提示字元或 PowerShell
2. 導航到專案目錄
   ```
   cd 路徑\到您的專案\chat-app
   ```
3. 使用 Docker Compose 啟動所有服務
   ```
   docker-compose up
   ```
   如果您希望在背景執行容器，可以添加 `-d` 參數：
   ```
   docker-compose up -d
   ```
4. 等待容器啟動完成
5. 在瀏覽器中訪問應用
   ```
   http://localhost:3000
   ```

### 3. 管理 Docker 容器

- **查看運行中的容器**
  ```
  docker-compose ps
  ```

- **停止所有容器**
  ```
  docker-compose down
  ```

- **停止並刪除所有容器和卷（將刪除資料庫數據）**
  ```
  docker-compose down -v
  ```

- **查看容器日誌**
  ```
  docker-compose logs
  ```
  或查看特定服務的日誌：
  ```
  docker-compose logs chat-app
  ```

- **重啟特定服務**
  ```
  docker-compose restart chat-app
  ```

## 傳統方式執行 (不使用 Docker)

### 1. 安裝 Node.js 和 npm

1. 前往 [Node.js 官網](https://nodejs.org/)
2. 下載並安裝最新的 LTS 版本
3. 安裝完成後，打開命令提示字元 (CMD) 或 PowerShell，執行以下命令確認安裝成功：
   ```
   node --version
   npm --version
   ```

### 2. 安裝 MongoDB

1. 下載 [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. 按照安裝精靈指示完成安裝
3. 建議將 MongoDB 設定為 Windows 服務，以便自動啟動
4. 確認 MongoDB 服務已啟動：
   ```
   net start MongoDB
   ```

### 3. 安裝 Redis

1. 下載 [Microsoft 提供的 Redis Windows 版本](https://github.com/microsoftarchive/redis/releases)
2. 解壓縮並執行 `redis-server.exe`

### 4. 安裝專案依賴

1. 進入專案目錄：
   ```
   cd 路徑\到您的專案\chat-app
   ```
2. 安裝依賴：
   ```
   npm install
   ```

### 5. 啟動應用

開發模式 (使用 nodemon，當檔案變更時會自動重啟)：
```
npm run dev
```

生產模式：
```
npm start
```

啟動後，在瀏覽器中訪問 `http://localhost:3000` 即可使用應用。

## 使用指南

### 基本聊天功能

1. 開啟應用後，輸入您的用戶名稱
2. 選擇或創建一個聊天室
3. 開始發送訊息

### 加密通訊

1. 點擊界面中的加密按鈕啟用加密
2. 加密後的訊息只有聊天室內的成員可以解密

### 視訊通話

1. 在聊天室中，點擊視訊通話按鈕
2. 允許瀏覽器使用麥克風和攝像頭
3. 等待對方接受通話邀請

## 技術堆疊

- 前端：HTML, CSS, JavaScript
- 後端：Node.js, Express
- 即時通訊：Socket.IO
- 加密：CryptoJS
- 聊天機器人：Node-NLP
- 資料庫：MongoDB
- 快取：Redis
- 視訊通話：WebRTC
- 容器化：Docker

## 故障排除

### Docker 相關問題

1. **Docker 服務無法啟動**
   - 確認 Docker Desktop 正在運行
   - 檢查 Windows 功能中的 "Hyper-V" 和 "Windows Subsystem for Linux" 是否已啟用
   - 重新啟動 Docker Desktop

2. **容器啟動失敗**
   - 檢查日誌：`docker-compose logs`
   - 確保沒有其他服務佔用 3000、27017 或 6379 端口

3. **應用無法連接到 MongoDB 或 Redis**
   - 在 docker-compose.yml 中確認服務名稱和連接設定
   - 確保容器網絡正常運作：`docker network ls`

### 傳統方式相關問題

1. **無法連接到伺服器**
   - 確認 Node.js 伺服器正在運行
   - 檢查防火牆設置，確保不阻擋應用端口
   - 在 Windows 上，可能需要以管理員權限運行命令提示字元

2. **視訊通話問題**
   - 確保瀏覽器已授予攝像頭和麥克風權限
   - 在 Windows 設定中檢查隱私設置，確保允許應用使用攝像頭和麥克風
   - 使用最新版本的 Chrome 或 Firefox 瀏覽器

3. **MongoDB 連接問題**
   - 確保 MongoDB 服務正在運行：`net start MongoDB`
   - 檢查 MongoDB 連接字串是否正確

## Windows 特有注意事項

1. **路徑長度限制**
   - Windows 有路徑長度限制，避免將專案放在過深的目錄結構中

2. **防火牆設定**
   - 首次運行應用時，Windows 可能會顯示防火牆警告，請允許應用訪問網絡

3. **WSL 2 與 Docker**
   - 如果使用 WSL 2 後端，確保已安裝最新的 WSL 2 Linux 核心
   - 可以通過 PowerShell 命令更新：`wsl --update`

## 貢獻指南

歡迎提交 Pull Request 或建立 Issue 來改進此專案。

## 授權

[MIT License](LICENSE)
```

這個新版本的 README.md 更加專注於 Docker 執行方式，同時保留了傳統方式的說明，並特別針對 Windows 環境增加了更多細節和故障排除指南。文件結構也更加清晰，讓使用者可以根據自己的需求選擇最適合的執行方式。

您可以將此內容複製到一個新的 README.md 文件中，替換原有的文件。

## Demo畫面
![image](https://github.com/user-attachments/assets/d8d95a3f-4284-4936-ab4c-05e073eaf77a)
![image](https://github.com/user-attachments/assets/c05c06f2-c58e-4680-967e-324f4d4dd244)
![image](https://github.com/user-attachments/assets/27727363-278d-4721-9918-1bf99662871d)

