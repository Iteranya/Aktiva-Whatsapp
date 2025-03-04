// PromptEngineer.js

const util = require('./util'); // your custom util module
const config = require('./config'); // your configuration module

class PromptEngineer {
  /**
   * @param {object} bot - Instance of AICharacter.
   * @param {object} discordo - Instance of Discordo.
   * @param {object} dimension - Instance of Dimension.
   * @param {string} llmSetting - JSON file name for LLM settings (default: "text-default.json").
   */
  constructor(bot, discordo, dimension, llmSetting = "text-default.json") {
    this.bot = bot;
    this.discordo = discordo;
    this.dimension = dimension;
    this.api = this.setApi(llmSetting);
    this.type = config.llm_type;
    this.stopping_string = [];
  }

  /**
   * Creates a text prompt using character, global variables, history, etc.
   * @returns {Promise<string>} - A JSON string with prompt data.
   */
  async createTextPrompt() {
    const jb = this.bot.instructions;
    const character = await this.bot.get_character_prompt();
    const globalvar = this.dimension.getDict().global || "";
    const locationvar = this.dimension.getDict().location || "";
    const instructionvar = this.dimension.getDict().instruction || "";
    const history = this.discordo.history;
    
    // Remove Discord mentions like <@1234567890> or <@!1234567890>
    let content = this.discordo.get_user_message_content().trim().replace(/<@!?\d+>/g, '');
    if (content.startsWith("^")) {
      content = content.replace("^", "");
    }
    // Remove non-word characters from the author name.
    const user = this.discordo.get_user_message_author_name().trim().replace(/[^\w]/g, '');
    const last_message = `[Reply]${user}: ${content}[End]`;
    // Optionally, you could remove last_message from history here.
    
    const prompt = character + globalvar + history + locationvar + instructionvar + jb + `\n[Replying to ${user}] ${this.bot.name}:`;
    
    // Define stopping strings (deduplicated)
    const stoppingStrings = [...new Set([
      "[System",
      "(System",
      `${user}:`,
      "[Reply",
      "(Reply",
      "System Note",
      "[End",
      "[/"
    ])];
    
    // Work on the API parameters.
    let data = this.api;
    data = data.parameters;
    data.prompt = prompt;
    data.stop_sequence = stoppingStrings;
    // Uncomment or modify if you plan to process image attachments:
    // const image_data = await this.discordo.process_attachment();
    // if (image_data != null) {
    //   data.images = [image_data];
    // }
    data.grammar = "";
    data.grammar_string = "";
    data.grammars = "";
    const data_string = JSON.stringify(data);
    data.images = [];
    this.stopping_string = stoppingStrings;
    return data_string;
  }

  /**
   * Loads API configuration from a given file.
   * @param {string} configFile - The configuration file name.
   * @returns {object} - The loaded API configuration.
   */
  setApi(configFile) {
    const file = util.get_file_name("configurations", configFile);
    const contents = util.get_json_file(file);
    let api = {};
    if (contents) {
      Object.assign(api, contents);
    }
    return api;
  }
}

module.exports = PromptEngineer;
