const { NlpManager } = require('node-nlp');

class ChatBotService {
  constructor() {
    this.manager = new NlpManager({ languages: ['zh'] });
    this.initialized = false;
    this.initPromise = this.initialize();
  }

  async initialize() {
    try {
      console.log('初始化聊天機器人...');
      // 添加基本訓練數據
      this.addTrainingData();
      
      // 訓練模型
      console.log('開始訓練聊天機器人...');
      await this.manager.train();
      console.log('聊天機器人訓練完成!');
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('聊天機器人初始化失敗:', error);
      return false;
    }
  }

  addTrainingData() {
    // 問候語
    this.manager.addDocument('zh', '你好', 'greeting');
    this.manager.addDocument('zh', '嗨', 'greeting');
    this.manager.addDocument('zh', '早安', 'greeting');
    this.manager.addDocument('zh', '晚安', 'greeting');
    this.manager.addDocument('zh', '哈囉', 'greeting');
    this.manager.addAnswer('zh', 'greeting', '你好！有什麼我能幫你的嗎？');
    this.manager.addAnswer('zh', 'greeting', '嗨！很高興見到你！');
    
    // 詢問天氣
    this.manager.addDocument('zh', '天氣如何', 'weather');
    this.manager.addDocument('zh', '今天會下雨嗎', 'weather');
    this.manager.addDocument('zh', '氣溫多少', 'weather');
    this.manager.addDocument('zh', '天氣', 'weather');
    this.manager.addAnswer('zh', 'weather', '抱歉，我目前無法獲取天氣信息。');
    
    // 聊天功能相關
    this.manager.addDocument('zh', '如何加密訊息', 'encryption');
    this.manager.addDocument('zh', '訊息加密', 'encryption');
    this.manager.addDocument('zh', '安全聊天', 'encryption');
    this.manager.addDocument('zh', '加密', 'encryption');
    this.manager.addAnswer('zh', 'encryption', '我們的聊天室使用端到端加密技術，確保只有您和對方能夠讀取訊息內容。');
    
    // 視訊聊天相關
    this.manager.addDocument('zh', '如何開始視訊通話', 'video');
    this.manager.addDocument('zh', '視訊聊天', 'video');
    this.manager.addDocument('zh', '語音通話', 'video');
    this.manager.addDocument('zh', '視訊', 'video');
    this.manager.addAnswer('zh', 'video', '點擊聊天室右上角的攝影機圖示，然後選擇您想要通話的用戶。');
    
    // 幫助指令
    this.manager.addDocument('zh', '幫助', 'help');
    this.manager.addDocument('zh', '使用說明', 'help');
    this.manager.addDocument('zh', '指令', 'help');
    this.manager.addDocument('zh', '說明', 'help');
    this.manager.addDocument('zh', '怎麼用', 'help');
    this.manager.addAnswer('zh', 'help', '可用指令：\n- @bot 你好：打招呼\n- @bot 天氣：詢問天氣\n- @bot 加密：了解加密功能\n- @bot 視訊：了解視訊功能');
  }

  async processMessage(message) {
    // 確保機器人已初始化
    if (!this.initialized) {
      await this.initPromise;
    }
    
    console.log('處理機器人訊息:', message);
    
    // 檢查是否是機器人指令
    if (!message || typeof message !== 'string') {
      console.log('非字符串訊息，跳過處理');
      return null;
    }
    
    if (!message.startsWith('@bot')) {
      console.log('非機器人指令，跳過處理');
      return null;
    }
    
    try {
      // 提取查詢內容
      const query = message.replace('@bot', '').trim();
      console.log('機器人查詢:', query);
      
      if (!query) {
        return {
          answer: '您好，我是聊天機器人。請輸入 "@bot 幫助" 獲取可用指令。',
          intent: 'greeting',
          score: 1
        };
      }
      
      // 處理查詢
      const response = await this.manager.process('zh', query);
      console.log('機器人回應:', response);
      
      // 如果沒有找到匹配的意圖或置信度太低
      if (!response.intent || response.score < 0.5) {
        return {
          answer: '抱歉，我不明白您的意思。試試輸入 "@bot 幫助" 獲取可用指令。',
          intent: 'unknown',
          score: 0
        };
      }
      
      return {
        answer: response.answer || '抱歉，我不明白您的意思。試試輸入 "@bot 幫助" 獲取可用指令。',
        intent: response.intent,
        score: response.score
      };
    } catch (error) {
      console.error('處理機器人訊息錯誤:', error);
      return {
        answer: '抱歉，處理您的請求時發生錯誤。請稍後再試。',
        intent: 'error',
        score: 0
      };
    }
  }
}

// 創建並導出單例
const chatBotService = new ChatBotService();
module.exports = chatBotService;