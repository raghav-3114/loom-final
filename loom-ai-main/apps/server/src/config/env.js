/**
 * @file env.js
 * @description Loads environment variables via dotenv and performs fail-fast validation
 * to ensure all required configuration keys are present before application startup.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

let envLoaded = false;
let loadedPath = '';

const pathsToTry = [
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '../../../../.env'),
  path.join(__dirname, '../../../.env'),
  path.join(__dirname, '../../.env')
];

const searchedPaths = [];
for (const p of pathsToTry) {
  const resolved = path.resolve(p);
  if (!searchedPaths.includes(resolved)) {
    searchedPaths.push(resolved);
  }
  if (fs.existsSync(resolved)) {
    dotenv.config({ path: resolved });
    envLoaded = true;
    loadedPath = resolved;
    break;
  }
}

if (envLoaded) {
  console.log(`\x1b[32m[EnvConfig] Environment variables successfully loaded from: ${loadedPath}\x1b[0m`);
} else {
  console.error(`\x1b[33m[EnvConfig] Warning: .env file not found. Searched locations:\n- ${searchedPaths.join('\n- ')}\x1b[0m`);
}

/**
 * Validates required environment variables and returns the configuration object.
 * Throws an error if required environment variables are missing.
 * 
 * @returns {Object} Validated environment variables object
 */
function validateEnv() {
  // PORT and DATABASE_PATH have safe local defaults below, so a .env file is
  // optional unless the project needs to override them.

  const configuredProviders = {
    router: process.env.ROUTER_PROVIDER || 'openrouter',
    planner: process.env.PLANNER_PROVIDER || 'openrouter',
    builder: process.env.BUILDER_PROVIDER || 'openrouter',
    reviewer: process.env.REVIEWER_PROVIDER || 'openrouter',
  };

  const apiKeyByProvider = {
    openrouter: 'OPENROUTER_API_KEY',
    groq: 'GROQ_API_KEY',
    gemini: 'GEMINI_API_KEY',
  };
  const missingProviderKeys = [...new Set(Object.values(configuredProviders))]
    .map((provider) => apiKeyByProvider[provider])
    .filter((keyName) => keyName && !process.env[keyName]);

  if (missingProviderKeys.length > 0 && process.env.NODE_ENV !== 'test') {
    console.error(`\x1b[31m[CRITICAL ERROR] Missing API key(s) for the configured provider(s): ${missingProviderKeys.join(', ')}. Add them to .env, then restart the server.\x1b[0m`);
    process.exit(1);
  }

  return {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
    DATABASE_PATH: process.env.DATABASE_PATH || path.join(__dirname, '../../data/loom.sqlite'),
    
    // AI configuration settings (defaulting to the specified MVP models)
    ROUTER_PROVIDER: configuredProviders.router,
    ROUTER_MODEL: process.env.ROUTER_MODEL || 'qwen/qwen3-coder-flash',
    
    PLANNER_PROVIDER: configuredProviders.planner,
    PLANNER_MODEL: process.env.PLANNER_MODEL || 'qwen/qwen3-coder-flash',

    BUILDER_PROVIDER: configuredProviders.builder,
    // Qwen2.5 Coder 7B is no longer offered by OpenRouter. Use an active
    // Qwen coding model that supports the JSON response format Loom requires.
    BUILDER_MODEL: process.env.BUILDER_MODEL || 'qwen/qwen3-coder-flash',

    REVIEWER_PROVIDER: configuredProviders.reviewer,
    REVIEWER_MODEL: process.env.REVIEWER_MODEL || 'qwen/qwen3-coder-flash',
    // Complex multi-file projects need more output room than a quick edit.
    BUILDER_MAX_TOKENS: Math.max(1024, parseInt(process.env.BUILDER_MAX_TOKENS || '16384', 10)),
  };
}

module.exports = {
  validateEnv,
};
