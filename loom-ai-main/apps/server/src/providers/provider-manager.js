/**
 * @file provider-manager.js
 * @description Single entry point for model dispatching across AI providers.
 * Handles primary-to-fallback provider failover, retry mechanisms, timeouts, and error handling.
 */

const { callOpenRouter } = require('./openrouter');
const { callGroq } = require('./groq');
const { callGemini } = require('./gemini');
const { validateEnv } = require('../config/env');

const env = validateEnv();

// Map generic model configs to actual provider model names
const MODEL_MAPPING = {
  groq: {
    'qwen-2.5-3b-instruct': 'llama-3.1-8b-instant',   // fast classifier
    'gemini-2.5-flash':     'llama-3.3-70b-versatile',  // best code-gen on Groq
    'llama-3.1-8b':         'llama-3.1-8b-instant',
    'gpt-oss-120b':         'openai/gpt-oss-120b',
    'qwen-27b':             'qwen/qwen3.6-27b',
  },
  gemini: {
    'qwen-2.5-3b-instruct': 'gemini-2.0-flash',
    'gemini-2.5-flash':     'gemini-2.0-flash',
    'llama-3.1-8b':         'gemini-2.0-flash',
  },
  openrouter: {
    'qwen-2.5-3b-instruct': 'qwen/qwen-2.5-coder-32b-instruct',
    'gemini-2.5-flash':     'google/gemini-flash-1.5',
    'llama-3.1-8b':         'meta-llama/llama-3.1-8b-instruct',
  }
};

/**
 * Resolves model name for a provider.
 */
function resolveModelName(provider, model) {
  return MODEL_MAPPING[provider]?.[model] || model;
}

/**
 * Dispatches LLM call to specified provider.
 */
async function callProvider(provider, modelName, messages, responseFormat, maxTokens) {
  const resolvedModel = resolveModelName(provider, modelName);
  
  switch (provider) {
    case 'gemini':
      if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
      return await callGemini({ model: resolvedModel, messages, apiKey: env.GEMINI_API_KEY, responseFormat });
    case 'groq':
      if (!env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');
      return await callGroq({ model: resolvedModel, messages, apiKey: env.GROQ_API_KEY, responseFormat });
    case 'openrouter':
      if (!env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not configured');
      return await callOpenRouter({ model: resolvedModel, messages, apiKey: env.OPENROUTER_API_KEY, responseFormat, maxTokens });
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Dispatches an LLM request to the requested provider and fallback providers if primary fails.
 * 
 * @param {Object} params
 * @param {string} params.agentRole - Agent identifier (router, builder, reviewer).
 * @param {Array} params.messages - Conversational prompt messages.
 * @param {Object} [params.responseFormat] - Response format schema.
 * @returns {Promise<Object>} Completed response object containing text.
 */
async function executeModelCall({ agentRole, messages, responseFormat }) {
  // Read config from env (fully configurable)
  let primaryProvider, primaryModel;
  const maxTokensByRole = {
    router: 1024,
    planner: 2048,
    builder: env.BUILDER_MAX_TOKENS,
    reviewer: 4096,
  };
  const maxTokens = maxTokensByRole[agentRole] || 4096;

  if (agentRole === 'router') {
    primaryProvider = env.ROUTER_PROVIDER;
    primaryModel = env.ROUTER_MODEL;
  } else if (agentRole === 'planner') {
    primaryProvider = env.PLANNER_PROVIDER;
    primaryModel = env.PLANNER_MODEL;
  } else if (agentRole === 'builder') {
    primaryProvider = env.BUILDER_PROVIDER;
    primaryModel = env.BUILDER_MODEL;
  } else {
    primaryProvider = env.REVIEWER_PROVIDER;
    primaryModel = env.REVIEWER_MODEL;
  }

  // Define fallbacks list — Gemini right after primary (strong, reliable structured output),
  // then Groq's stronger code model, then weaker Groq models, OpenRouter last (currently unreachable)
  // Do not silently send prompts to a different provider. The configured
  // provider and model are the only route used for a request.
  const basePriorities = [{ provider: primaryProvider, model: primaryModel }];

  // Filter list to keep only unique combinations
  const seen = new Set();
  const providersPriority = [];
  for (const item of basePriorities) {
    const key = `${item.provider}:${item.model}`;
    if (!seen.has(key)) {
      seen.add(key);
      providersPriority.push(item);
    }
  }

  let lastError = null;

  for (const { provider, model } of providersPriority) {
    // Check if key is available
    const keyName = `${provider.toUpperCase()}_API_KEY`;
    const apiKey = env[keyName];
    if (!apiKey) {
      console.log(`[ProviderManager] API Key for ${provider} (${keyName}) is not present in env!`);
      continue;
    }

    try {
      const resolvedModel = resolveModelName(provider, model);
      console.log(`[ProviderManager] Invocating ${provider} (model: ${model}, resolved: ${resolvedModel}) for role ${agentRole}. Key: ${apiKey.substring(0, 4)}... length: ${apiKey.length}`);
      return await callProvider(provider, model, messages, responseFormat, maxTokens);
    } catch (err) {
      console.warn(`[ProviderManager] Failure on ${provider} for role ${agentRole}: ${err.message}. Trying next fallback...`);
      lastError = err;
    }
  }

  throw new Error(`All configured AI providers failed. Last error: ${lastError?.message}`);
}

module.exports = {
  executeModelCall,
};
