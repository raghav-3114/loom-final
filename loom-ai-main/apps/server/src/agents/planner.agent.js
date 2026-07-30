/**
 * Design Planner Agent node.
 * Runs after Router (so off_topic requests never reach it) and before Builder.
 * Produces an internal Design Specification that Builder must follow — never generates
 * code itself, and its output is never shown to the end user.
 */

const fs = require('fs');
const path = require('path');
const { executeModelCall } = require('../providers/provider-manager');
const { repairJson } = require('../utils/json-repair');
const { designSpecSchema } = require('../schema/agent.schema');

/**
 * Produces a Design Specification for the Builder to follow.
 * @param {Object} state - LangGraph pipeline state (prompt, stack, intent, files).
 * @returns {Promise<Object>} Updated state with `designSpec`, or `planningFailed: true` on error.
 */
async function plannerNode(state) {
  try {
    state.onProgress?.('Planning the page structure, components, and interactions...');
    const promptPath = path.join(__dirname, '../prompts/planner.system.txt');
    const systemPrompt = fs.readFileSync(promptPath, 'utf8');

    const existingFiles = Object.keys(state.files || {}).join(', ') || 'none (new project)';

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `User Request: "${state.prompt}"\nActive Stack: "${state.stack || 'vanilla'}"\nIntent: "${state.intent || 'generate'}"\nExisting Files: ${existingFiles}`,
      },
    ];

    const result = await executeModelCall({
      agentRole: 'planner',
      messages: formattedMessages,
      responseFormat: { type: 'json_object' },
    });

    const parsed = repairJson(result.text);
    const validation = designSpecSchema.safeParse(parsed);

    if (!validation.success) {
      throw new Error(`Design specification failed validation: ${validation.error.message}`);
    }

    return {
      ...state,
      designSpec: validation.data,
      planningFailed: false,
    };
  } catch (error) {
    console.error('[PlannerAgent] Error:', error);
    return {
      ...state,
      designSpec: null,
      planningFailed: true,
      errors: [...(state.errors || []), `Design planning failed: ${error.message}`],
    };
  }
}

module.exports = {
  plannerNode,
};
