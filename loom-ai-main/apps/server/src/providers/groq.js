/**
 * @file groq.js
 * @description Wrapper client around Groq API.
 */

const axios = require('axios');

/**
 * Sends a completion request to Groq API.
 * 
 * @param {Object} options 
 * @param {string} options.model - Model identifier string.
 * @param {Array<{role: string, content: string}>} options.messages - Message history array.
 * @param {string} options.apiKey - API key.
 * @param {Object} [options.responseFormat] - Response format configurations.
 * @returns {Promise<Object>} API completion response payload.
 */
async function callGroq({ model, messages, apiKey, responseFormat }) {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: model || 'llama3-8b-8192',
        messages,
        response_format: responseFormat ? { type: responseFormat.type } : undefined,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const text = response.data?.choices?.[0]?.message?.content || '';
    return { text, provider: 'groq', model };
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    throw new Error(`Groq API Call Failed: ${errorMsg}`);
  }
}

module.exports = {
  callGroq,
};
