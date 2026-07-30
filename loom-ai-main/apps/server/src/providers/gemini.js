/**
 * @file gemini.js
 * @description Wrapper client around Google Gemini API using OpenAI compatibility layer or native requests.
 */

const axios = require('axios');

/**
 * Sends a completion request to Google Gemini API.
 * 
 * @param {Object} options 
 * @param {string} options.model - Model identifier string.
 * @param {Array<{role: string, content: string}>} options.messages - Message history array.
 * @param {string} options.apiKey - API key.
 * @param {Object} [options.responseFormat] - Response format configurations.
 * @returns {Promise<Object>} API completion response payload.
 */
async function callGemini({ model, messages, apiKey, responseFormat }) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: responseFormat ? {
          responseMimeType: responseFormat.type === 'json_object' ? 'application/json' : 'text/plain',
        } : {},
      },
      { timeout: 30000 }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { text, provider: 'gemini', model };
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    throw new Error(`Gemini API Call Failed: ${errorMsg}`);
  }
}

module.exports = {
  callGemini,
};
