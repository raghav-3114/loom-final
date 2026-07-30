/**
 * @file openrouter.js
 * @description Wrapper client around OpenRouter API.
 */

const axios = require('axios');

/**
 * Sends a completion request to OpenRouter API.
 * 
 * @param {Object} options 
 * @param {string} options.model - Model identifier string.
 * @param {Array<{role: string, content: string}>} options.messages - Message history.
 * @param {string} options.apiKey - API key.
 * @param {Object} [options.responseFormat] - Response format configurations.
 * @returns {Promise<Object>} API completion response payload.
 */
async function callOpenRouter({ model, messages, apiKey, responseFormat, maxTokens }) {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model || 'meta-llama/llama-3.1-8b-instruct',
        messages,
        response_format: responseFormat ? { type: responseFormat.type } : undefined,
        // OpenRouter may otherwise choose a very large model-default output
        // budget (65,536 for Qwen3 Coder), which can exceed account credit
        // before a small request is even sent.
        max_tokens: maxTokens || 4096,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://loom.ai',
          'X-Title': 'Loom AI Builder',
        },
        timeout: 30000,  // 30 seconds to allow full code generation
      }
    );

    const text = response.data?.choices?.[0]?.message?.content || '';
    return { text, provider: 'openrouter', model };
  } catch (error) {
    const responseData = error.response?.data;
    const apiError = responseData?.error;
    const errorMsg =
      apiError?.message ||
      apiError?.metadata?.raw ||
      responseData?.message ||
      responseData?.detail ||
      (typeof apiError === 'string' ? apiError : '') ||
      error.message ||
      'OpenRouter returned an unspecified error.';
    const status = error.response?.status;
    const statusLabel = status ? ` (HTTP ${status})` : '';
    throw new Error(`OpenRouter API Call Failed${statusLabel}: ${errorMsg}`);
  }
}

module.exports = {
  callOpenRouter,
};
