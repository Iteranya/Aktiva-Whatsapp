require('dotenv').config();
const figlet = require('figlet');
const { green, magenta, bold, red } = require('colorette');

const WhatsAppBot = require('./whatsappBot');
const LlmApi = require('./ai');
const HistoryManager = require('./historyManager');

// --- Initialize AI Integration ---
const llmConfig = {
  modelType: process.env.MODEL_TYPE || 'remote',
  apiAddress: process.env.API_ADDRESS,
  generationEndpoint: process.env.GENERATION_ENDPOINT,
  headers: {
    'Authorization': process.env.API_AUTHORIZATION
  },
  stoppingString: process.env.STOPPING_STRING || null
};
const llmApi = new LlmApi(llmConfig);

// --- Display a Banner ---
figlet.text('My WhatsApp Bot', (err, data) => {
  if (err) {
    console.error('Figlet error:', err);
    return;
  }
  console.clear();
  console.log(bold(magenta(data)));
  console.log(bold(magenta("Ensure .env is properly configured.")));
  console.log("\n\nLoading...");
});

// --- Initialize the WhatsApp Bot ---
const bot = new WhatsAppBot({
  headless: true
});

// Helper function to build a prompt from history records.
function buildPromptFromHistory(history) {
  let prompt = '';
  // Each record is assumed to have: sender ('user' or 'bot') and message.
  history.forEach(record => {
    if (record.sender === 'user') {
      prompt += `User: ${record.message}\n`;
    } else if (record.sender === 'bot') {
      prompt += `Bot: ${record.message}\n`;
    }
  });
  return prompt;
}

// --- When the bot is ready, send welcome media to a default contact (if desired) ---
bot.on('ready', () => {
  console.log(green('WhatsApp Bot is active!'));
  console.log("Type 'off' to shutdown the bot.");
  // You can broadcast a welcome message if needed.
});

// --- Message Handling ---
bot.on('message', async (message) => {
  // Process only non-group messages.
  if (!message.isGroupMsg) {
    // Shutdown command handling.
    if (message.body.toLowerCase().includes('off')) {
      try {
        await message.reply("Love u");
        await bot.sendMessage(message.from, "*_BOT SHUTDOWN_*");
        console.log(bold(red('Bot shutting down.')));
        process.exit(0);
      } catch (error) {
        console.error("Error processing shutdown command:", error.message);
      }
    } else {
      try {
        // Initialize a history manager for this contact.
        const historyManager = new HistoryManager(message.from);
        print(message.from)
        await historyManager.initialize();

        // Append the incoming message to history.
        await historyManager.appendMessage({
          from: message.from,
          message: message.body,
          timestamp: Date.now(),
          sender: 'user'
        });

        // Read the full conversation history and build the prompt.
        const history = await historyManager.getHistory();
        const prompt = buildPromptFromHistory(history);

        // Send the prompt to the LLM backend.
        const aiResponse = await llmApi.sendPrompt(prompt);

        // Append the AI response to the history.
        await historyManager.appendMessage({
          from: message.from,
          message: aiResponse,
          timestamp: Date.now(),
          sender: 'bot'
        });

        // Reply to the user with the AI response.
        await bot.sendMessage(message.from, aiResponse);
      } catch (err) {
        console.error("Error processing message:", err.message);
        await message.reply("Sorry, an error occurred while processing your message.");
      }
    }
  }
});
