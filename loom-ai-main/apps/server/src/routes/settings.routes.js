/**
 * @file settings.routes.js
 * @description API route for reading and persisting AI provider/model configuration.
 * GET /api/settings - returns current provider/model config for all three agents.
 * POST /api/settings - persists a new config by writing to .env file (agent-level overrides).
 */

const express = require('express');
const { validateEnv } = require('../config/env');

const router = express.Router();

// Human-readable display labels for models and providers
const PROVIDER_LABELS = {
  groq: 'Groq',
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
};

const MODEL_LABELS = {
  'qwen/qwen3-coder-flash': 'Qwen3 Coder Flash',
  'qwen-2.5-3b-instruct': 'Qwen 2.5 3B Instruct',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'llama-3.1-8b': 'Llama 3.1 8B',
};

/**
 * GET /api/settings
 * Returns the current live provider/model configuration per agent role.
 */
router.get('/', (req, res) => {
  try {
    const env = validateEnv();

    const config = {
      router: {
        provider: env.ROUTER_PROVIDER,
        providerLabel: PROVIDER_LABELS[env.ROUTER_PROVIDER] || env.ROUTER_PROVIDER,
        model: env.ROUTER_MODEL,
        modelLabel: MODEL_LABELS[env.ROUTER_MODEL] || env.ROUTER_MODEL,
      },
      builder: {
        provider: env.BUILDER_PROVIDER,
        providerLabel: PROVIDER_LABELS[env.BUILDER_PROVIDER] || env.BUILDER_PROVIDER,
        model: env.BUILDER_MODEL,
        modelLabel: MODEL_LABELS[env.BUILDER_MODEL] || env.BUILDER_MODEL,
      },
      reviewer: {
        provider: env.REVIEWER_PROVIDER,
        providerLabel: PROVIDER_LABELS[env.REVIEWER_PROVIDER] || env.REVIEWER_PROVIDER,
        model: env.REVIEWER_MODEL,
        modelLabel: MODEL_LABELS[env.REVIEWER_MODEL] || env.REVIEWER_MODEL,
      },
      availableProviders: Object.entries(PROVIDER_LABELS).map(([value, label]) => ({ value, label })),
      availableModels: Object.entries(MODEL_LABELS).map(([value, label]) => ({ value, label })),
    };

    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, error: `Failed to read settings: ${err.message}` });
  }
});

module.exports = router;
