/**
 * Prompt loader module for the "react-tailwind" stack.
 * Provides system and user prompt templates specifically formatted for React/Tailwind projects.
 */

const fs = require('fs');
const path = require('path');

/**
 * Loads system prompt template for the React + Tailwind stack.
 * @returns {string} System prompt string.
 */
function getReactTailwindSystemPrompt() {
  const promptPath = path.join(__dirname, '../../prompts/builder-react-tailwind.system.txt');
  return fs.readFileSync(promptPath, 'utf8');
}

/**
 * Loads builder prompt for React + Tailwind project generation.
 * @param {string} userPrompt - User prompt describing requested UI (or the Planner's
 *   normalized/expanded request when a Design Specification is available).
 * @returns {string} Formatted prompt string for Builder agent.
 */
function getReactTailwindBuilderPrompt(userPrompt) {
  return `Implement a production-quality React + Tailwind component/page for this request: "${userPrompt}"\nIf an [INTERNAL DESIGN SPECIFICATION] is provided below, treat it as the authoritative plan and implement it precisely rather than inventing your own structure.`;
}

module.exports = {
  getReactTailwindSystemPrompt,
  getReactTailwindBuilderPrompt,
};
