/**
 * @file context.js
 * @description Context manager responsible for compressing message history when length approaches token limits (30-50 messages).
 * Preserves framework selection, architecture decisions, previous modifications, user choices, and outstanding tasks.
 */

const { executeModelCall } = require('../providers/provider-manager');

/**
 * Compresses chat history if it exceeds threshold limit (e.g. 30 messages).
 * @param {Array} history - Message history logs.
 * @returns {Promise<Array>} Compressed/Optimized message history logs.
 */
async function compressHistory(history) {
  if (!history || history.length < 30) {
    return history;
  }

  console.log(`[ContextManager] Compressing long chat history (${history.length} messages) to optimize context window...`);

  try {
    const formattedLog = history
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const prompt = `You are a Senior Project Architect. Analyze and compress the following chat log history for a website building session.
You MUST write a concise but extremely thorough architectural state summary.
This summary must preserve:
1. Active frontend stack ('vanilla' or 'react-tailwind')
2. Overall project structure and file architecture
3. What design styles or features have already been implemented or edited
4. User decisions, custom styling choices, and explicitly approved preferences
5. List of outstanding or pending features/tasks still requested by the user

Chat history:
${formattedLog}

Summary of Project State:`;

    const messages = [
      { role: 'system', content: 'You summarize development history without losing any technical architecture choices, stack details, user decisions, or outstanding tasks.' },
      { role: 'user', content: prompt }
    ];

    const result = await executeModelCall({
      agentRole: 'router',
      messages
    });

    const summaryText = result.text || 'History summarized.';

    // Return a condensed history starting with the architectural summary
    return [
      {
        id: `summary-${Date.now()}`,
        role: 'assistant',
        content: `[ARCHITECTURAL SESSION SUMMARY]\n\n${summaryText}`,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...history.slice(-4) // Keep the last 4 messages to preserve immediate conversational context
    ];
  } catch (error) {
    console.error('[ContextManager] Compression failed, returning original history:', error);
    return history;
  }
}

module.exports = {
  compressHistory,
};
