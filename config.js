module.exports = {
  // === Gemini AI Settings ===
  geminiApiKey: 'https://sadiya-tech-apis.vercel.app/ai/gemini?q=hi&apikey=dinesh-api-key', // Google AI Studio key
  aiModel: 'gemini-1.5-flash', // Or 'gemini-pro'

  // === Bot Settings ===
  botName: '𝐙𝐄𝐏𝐈𝐗-𝐀𝐈',
  sessionPath: './session',
  usePairingCode: true,
  defaultPhoneNumber: '94740744203', // Default, web form එකෙන් override

  // === Auto React ===
  autoReactMessages: true,
  messageReactEmojis: ['👍', '❤️', '😂', '😲', '😢', '😠'],

  // === Status React ===
  autoReactStatus: true,
  statusReactEmoji: '❤️',

  // === Notifications ===
  sendConnectNotification: true,
  connectNotifyMessage: 'Zepix ai Bot is now ONLINE!',

  // === AI Reply ===
  aiReplyToStatus: true
};
