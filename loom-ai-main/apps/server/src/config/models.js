/**
 * @file models.js
 * @description Model mapping configuration defining primary and fallback providers and model identifiers
 * for each agent role (Router, Builder, Reviewer).
 */

const { PROVIDERS } = require('./constants');

/**
 * Model definitions per agent role with fallback options.
 */
const MODEL_CONFIG = {
  router: {
    primary: {
      provider: PROVIDERS.GROQ,
      model: 'qwen-2.5-3b-instruct',
    },
    fallback: {
      provider: PROVIDERS.OPENROUTER,
      model: 'qwen/qwen-2.5-3b-instruct',
    },
  },
  builder: {
    primary: {
      provider: PROVIDERS.GROQ,
      model: 'qwen-2.5-coder-7b-instruct',
    },
    fallback: {
      provider: PROVIDERS.OPENROUTER,
      model: 'qwen/qwen-2.5-coder-7b-instruct',
    },
  },
  reviewer: {
    primary: {
      provider: PROVIDERS.GROQ,
      model: 'llama-3.1-8b-instant',
    },
    fallback: {
      provider: PROVIDERS.OPENROUTER,
      model: 'meta-llama/llama-3.1-8b-instruct',
    },
  },
};

module.exports = {
  MODEL_CONFIG,
};
