const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const { GoogleGenerativeAI } = require('google-generativeai');
const config = require('./config');
const plugins = require('./lib/plugins');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const model = genAI.getGenerativeModel({ model: config.aiModel });

// Global sock & status
let sock = null;
let isConnected = false;

const sessionPath = config.sessionPath;
if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

async function startBot(phoneNumber = config.defaultPhoneNumber) {
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: Browsers.ubuntu('Chrome')
  });

  // Pairing Code Generate
  if (config.usePairingCode && !sock.authState.creds.registered) {
    const code = await sock.requestPairingCode(phoneNumber.replace(/\D/g, ''));
    console.log(`Pairing Code for ${phoneNumber}: ${code}`);
    return { code }; // Return to web
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      isConnected = false;
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) setTimeout(() => startBot(phoneNumber), 3000);
    } else if (connection === 'open') {
      isConnected = true;
      console.log('Bot Connected!');
      if (config.sendConnectNotification) {
        const selfJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        await sock.sendMessage(selfJid, { text: config.connectNotifyMessage });
      }
    }
  });

  // Auto React to Messages
  const getRandomEmoji = () => config.messageReactEmojis[Math.floor(Math.random() * config.messageReactEmojis.length)];
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.key.fromMe && msg.message && config.autoReactMessages) {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: getRandomEmoji(), key: msg.key } });
    }

    // Commands & Buttons (same as before)
    if (!msg.key.fromMe && msg.message) {
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      const jid = msg.key.remoteJid;
      if (text.startsWith('/')) {
        const [cmd, ...args] = text.slice(1).trim().split(' ');
        if (cmd.toLowerCase() === 'menu') await plugins.help(sock, jid);
        else if (plugins[cmd.toLowerCase()]) await plugins[cmd.toLowerCase()](sock, jid, args.join(' '));
      }
      if (msg.message?.buttonsResponseMessage) {
        const selectedId = msg.message.buttonsResponseMessage.selectedButtonId;
        // Handle buttons (same as before)
        if (selectedId.startsWith('weather_')) {
          const city = selectedId.split('weather_')[1];
          await plugins.weather(sock, jid, city);
        } else if (selectedId === 'joke_more') await plugins.joke(sock, jid);
        else if (selectedId === 'menu') await plugins.help(sock, jid);
      }
    }
  });

  // Status Auto React & Gemini AI Reply
  sock.ev.on('messages.update', async (updates) => {
    for (const { key, update } of updates) {
      if (key.remoteJid?.endsWith('@s.whatsapp.net')) {
        if (config.autoReactStatus) {
          await sock.sendMessage(key.remoteJid, { react: { text: config.statusReactEmoji, key } });
        }
        if (config.aiReplyToStatus) {
          try {
            const statusText = update?.message?.protocolMessage?.status?.text || 'New status!';
            const result = await model.generateContent(`Reply wittily to this WhatsApp status: "${statusText}" (1-2 sentences)`);
            const aiReply = await result.response.text();

            const statusOwner = key.participant || key.remoteJid;
            await sock.sendMessage(statusOwner, { text: aiReply.trim() });
          } catch (err) {
            console.error('Gemini Error:', err);
          }
        }
      }
    }
  });

  return sock;
}

module.exports = { startBot, isConnected };
