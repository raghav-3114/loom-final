/**
 * @file constants.js
 * @description Application-wide constants including supported project stacks, prompt intents,
 * AI provider names, retry limits, and upload restrictions.
 */

/** Supported tech stacks */
const STACKS = {
  VANILLA: 'vanilla',
  REACT_TAILWIND: 'react-tailwind',
};

/** Supported agent prompt intents */
const INTENTS = {
  GENERATE: 'generate',
  EDIT: 'edit',
  EXPLAIN: 'explain',
  DEBUG: 'debug',
  OFF_TOPIC: 'off_topic',
};

/** Supported LLM Provider Identifiers */
const PROVIDERS = {
  OPENROUTER: 'openrouter',
  GROQ: 'groq',
  GEMINI: 'gemini',
};

/** Retry configuration limits */
const RETRY_LIMITS = {
  MAX_RETRIES: 3,
  BACKOFF_MS: 1000,
};

/** File upload limits */
const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
};

module.exports = {
  STACKS,
  INTENTS,
  PROVIDERS,
  RETRY_LIMITS,
  UPLOAD_LIMITS,
};
