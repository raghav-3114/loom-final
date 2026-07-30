/**
 * Prompt loader module for the "vanilla" stack.
 * Provides system and user prompt templates specifically formatted for HTML/CSS/JS projects.
 */

const fs = require('fs');
const path = require('path');

/**
 * Loads system prompt template for the Vanilla stack.
 * @returns {string} System prompt string for Vanilla stack.
 */
function getVanillaSystemPrompt() {
  const promptPath = path.join(__dirname, '../../prompts/builder-vanilla.system.txt');
  return fs.readFileSync(promptPath, 'utf8');
}

/**
 * Loads builder prompt for Vanilla project generation.
 * @param {string} userPrompt - User prompt describing requested UI (or the Planner's
 *   normalized/expanded request when a Design Specification is available).
 * @returns {string} Formatted prompt string for Builder agent.
 */
function getVanillaBuilderPrompt(userPrompt) {
  return `Implement a production-quality Vanilla HTML/CSS/JS interface for this request: "${userPrompt}"\nIf an [INTERNAL DESIGN SPECIFICATION] is provided below, treat it as the authoritative plan and implement it precisely rather than inventing your own structure.`;
}

module.exports = {
  getVanillaSystemPrompt,
  getVanillaBuilderPrompt,
};
