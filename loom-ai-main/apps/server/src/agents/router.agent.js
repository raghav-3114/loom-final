/**
 * Router Agent for intent classification and off_topic gating.
 * Classifies input into generate | edit | explain | debug | off_topic.
 */

const fs = require('fs');
const path = require('path');
const { executeModelCall } = require('../providers/provider-manager');
const { repairJson } = require('../utils/json-repair');

/**
 * Classifies user message intent and checks if off-topic.
 * @param {Object} state - LangGraph pipeline state.
 * @returns {Promise<Object>} Updated state with intent classification outcome.
 */
async function routerNode(state) {
  try {
    state.onProgress?.('Classifying your request and selecting the project stack...');
    const promptPath = path.join(__dirname, '../prompts/router.system.txt');
    const systemPrompt = fs.readFileSync(promptPath, 'utf8');

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Message: "${state.prompt}"\nActive Stack Context: "${state.stack || 'vanilla'}"` }
    ];

    const result = await executeModelCall({
      agentRole: 'router',
      messages: formattedMessages,
      responseFormat: { type: 'json_object' }
    });

    let decision = { intent: 'generate', stack: 'vanilla', reasoning: '' };
    try {
      decision = repairJson(result.text);
    } catch (e) {
      console.warn('[RouterAgent] Failed to parse/repair JSON, attempting fallback regex parser...');
      const text = result.text.toLowerCase();
      if (text.includes('off_topic') || text.includes('off-topic')) {
        decision.intent = 'off_topic';
      } else if (text.includes('explain')) {
        decision.intent = 'explain';
      } else if (text.includes('debug') || text.includes('fix')) {
        decision.intent = 'debug';
      } else if (text.includes('edit') || text.includes('update') || text.includes('style')) {
        decision.intent = 'edit';
      } else {
        decision.intent = 'generate';
      }
      decision.stack = text.includes('react') ? 'react-tailwind' : 'vanilla';
    }

    return {
      ...state,
      intent: decision.intent,
      stack: decision.stack || state.stack || 'vanilla',
      reasoning: decision.reasoning,
    };
  } catch (error) {
    console.error('[RouterAgent] Error:', error);
    return {
      ...state,
      intent: 'generate',
      stack: state.stack || 'vanilla',
      reasoning: 'Router failed, fell back to default generation.'
    };
  }
}

module.exports = {
  routerNode,
};
