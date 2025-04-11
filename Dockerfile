# 使用官方 Node.js 映像作為基礎
FROM node:16

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製應用程式代碼
COPY . .

# 暴露端口
EXPOSE 3000

# 啟動命令
CMD ["npm", "start"]