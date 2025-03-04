const axios = require('axios');

class LlmApi {
  /**
   * @param {object} config - Configuration for the API.
   * @param {string} config.modelType - 'local' or 'remote'
   * @param {string} config.apiAddress - Base URL for your AI API.
   * @param {string} config.generationEndpoint - Endpoint path (e.g. '/generate')
   * @param {object} config.headers - HTTP headers (e.g. Authorization)
   * @param {string|null} config.stoppingString - Optional stopping string for the AI.
   */
  constructor(config) {
    this.modelType = config.modelType || 'remote';
    this.apiAddress = config.apiAddress;
    this.generationEndpoint = config.generationEndpoint;
    this.headers = config.headers || {};
    this.stoppingString = config.stoppingString || null;
  }

  async sendLocal(prompt) {
    try {
      const url = `http://localhost:5001/api/v1`;
      const response = await axios.post(url, { prompt }, { headers: this.headers });
      if (response.status === 200 && response.data) {
        return this.cleanResponse(response.data);
      } else {
        throw new Error(`HTTP status ${response.status}`);
      }
    } catch (error) {
      throw error;
    }
  }

  async sendRemote(prompt) {
    try {
      const model = process.env.TEXT_EVALUATOR_MODEL; // set in .env
      const messages = [{
        role: 'user',
        content: prompt
      }];
      const response = await axios.post(
        "https://openrouter.ai/api/v1",
        {
          model,
          messages,
          stop: this.stoppingString
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': process.env.API_AUTHORIZATION
          }
        }
      );
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      throw error;
    }
  }

  cleanResponse(responseData) {
    let text = '';
    if (responseData.results && responseData.results[0]?.text) {
      text = responseData.results[0].text;
    } else if (responseData.choices && responseData.choices[0]?.message?.content) {
      text = responseData.choices[0].message.content;
    }
    return text.trim();
  }

  async sendPrompt(prompt) {
    try {
      if (this.modelType === 'local') {
        return await this.sendLocal(prompt);
      } else if (this.modelType === 'remote') {
        return await this.sendRemote(prompt);
      } else {
        throw new Error(`Unsupported model type: ${this.modelType}`);
      }
    } catch (error) {
      if (this.modelType === 'local') {
        console.error(`Local model error: ${error.message}. Trying remote...`);
        return await this.sendRemote(prompt);
      }
      return `Error: ${error.message}`;
    }
  }
}

module.exports = LlmApi;
