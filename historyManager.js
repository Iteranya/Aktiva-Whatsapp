const fs = require('fs');
const path = require('path');

class HistoryManager {
  /**
   * @param {string} contactId - The WhatsApp contact ID (e.g. "1234567890@c.us").
   */
  constructor(contactId) {
    // Remove the "@c.us" part if present
    this.contactNumber = contactId.includes('@') ? contactId.split('@')[0] : contactId;
    // Folder name like "wa-1234567890"
    this.folderPath = path.join(__dirname, `wa-${this.contactNumber}`);
    this.chatHistoryFile = path.join(this.folderPath, 'chat_history.jsonl');
    this.configurationFile = path.join(this.folderPath, 'configuration.json');
  }

  /**
   * Initializes the folder and files if they don't exist.
   */
  async initialize() {
    try {
      // Create folder if needed
      await fs.promises.mkdir(this.folderPath, { recursive: true });
      // Create chat_history.jsonl if it doesn't exist
      try {
        await fs.promises.access(this.chatHistoryFile);
      } catch (err) {
        await fs.promises.writeFile(this.chatHistoryFile, '', 'utf8');
      }
      // Create configuration.json if it doesn't exist (empty object for now)
      try {
        await fs.promises.access(this.configurationFile);
      } catch (err) {
        await fs.promises.writeFile(this.configurationFile, JSON.stringify({}, null, 2), 'utf8');
      }
      console.log(`Initialized history for contact ${this.contactNumber}`);
    } catch (err) {
      console.error(`Failed to initialize history for contact ${this.contactNumber}:`, err);
    }
  }

  /**
   * Appends a message record to the chat history file.
   * @param {object} messageObj - The message object to store.
   */
  async appendMessage(messageObj) {
    try {
      const line = JSON.stringify(messageObj) + "\n";
      await fs.promises.appendFile(this.chatHistoryFile, line, 'utf8');
      console.log(`Message appended for contact ${this.contactNumber}`);
    } catch (err) {
      console.error(`Error appending message for ${this.contactNumber}:`, err);
    }
  }

  /**
   * Reads and returns the chat history as an array of message objects.
   */
  async getHistory() {
    try {
      const data = await fs.promises.readFile(this.chatHistoryFile, 'utf8');
      const lines = data.split('\n').filter(line => line.trim() !== '');
      return lines.map(line => JSON.parse(line));
    } catch (err) {
      console.error(`Error reading history for ${this.contactNumber}:`, err);
      return [];
    }
  }
}

module.exports = HistoryManager;
