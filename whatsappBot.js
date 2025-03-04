// whatsappBot.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class WhatsAppBot {
  constructor(options = {}) {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: options.headless !== undefined ? options.headless : true,
        args: options.puppeteerArgs || ["--no-sandbox", "--disable-gpu"],
      }
    });

    this.client.on('qr', (qr) => {
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log("WhatsApp Bot is active!");
      if (this.onReady) this.onReady();
    });

    this.client.initialize();
  }

  /**
   * Sends a message to a specific contact.
   * @param {string} contact - Contact ID in the format "1234567890@c.us".
   * @param {string|object} message - Message text or MessageMedia object.
   * @param {object} options - Additional options for sending the message.
   */
  async sendMessage(contact, message, options = {}) {
    try {
      await this.client.sendMessage(contact, message, options);
    } catch (err) {
      console.error(`Error sending message to ${contact}: ${err.message}`);
    }
  }

  /**
   * Broadcasts a message to a list of contacts.
   * @param {Array<string>} contacts - An array of contact IDs.
   * @param {string|object} message - Message text or MessageMedia object.
   * @param {object} options - Additional options for sending the message.
   */
  async broadcastMessage(contacts, message, options = {}) {
    for (const contact of contacts) {
      await this.sendMessage(contact, message, options);
    }
  }

  /**
   * Exposes the client event listener for custom events.
   * @param {string} event - Event name.
   * @param {Function} callback - Callback function.
   */
  on(event, callback) {
    this.client.on(event, callback);
  }
}

module.exports = WhatsAppBot;
