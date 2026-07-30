/**
 * @file graph.js
 * @description LangGraph state orchestration and node routing for Loom AI agent pipeline.
 * Links Router, Builder, Reviewer, and explanation/debugging stubs using StateGraph.
 */

const { StateGraph, Annotation, START, END } = require('@langchain/langgraph');
const { routerNode } = require('./router.agent');
const { plannerNode } = require('./planner.agent');
const { builderNode } = require('./builder.agent');
const { reviewerNode } = require('./reviewer.agent');
const { executeModelCall } = require('../providers/provider-manager');

// Define Graph State Schema
const GraphState = Annotation.Root({
  prompt: Annotation(),
  history: Annotation(),
  files: Annotation(),
  stack: Annotation(),
  intent: Annotation(),
  reasoning: Annotation(),
  designSpec: Annotation(),
  planningFailed: Annotation(),
  summary: Annotation(),
  actions: Annotation(),
  approved: Annotation(),
  issues: Annotation(),
  retryCount: Annotation(),
  explanation: Annotation(),
  errors: Annotation(),
  // Runtime-only callback used by HTTP routes to stream actual graph stages.
  onProgress: Annotation(),
});

/**
 * Node for handling code explanations in beginner-friendly language.
 */
async function explainNode(state) {
  try {
    const filesSummary = Object.entries(state.files || {})
      .map(([path, content]) => `File: "${path}"\n\`\`\`\n${content.substring(0, 1000)}\n\`\`\``)
      .join('\n\n');

    const formattedMessages = [
      {
        role: 'system',
        content: `You are a warm, beginner-friendly frontend coach. Explain the concepts, components, or layout requested in plain, jargon-free language. Refer to active stack: ${state.stack}.`
      },
      {
        role: 'user',
        content: `Explain: "${state.prompt}"\n\nCurrent Project Code context:\n${filesSummary}`
      }
    ];

    const result = await executeModelCall({
      // Explanations are short text responses and must not use the Builder's
      // large code-generation token budget.
      agentRole: 'reviewer',
      messages: formattedMessages
    });

    return {
      ...state,
      explanation: result.text
    };
  } catch (error) {
    return {
      ...state,
      explanation: `Could not load explanation: ${error.message}`
    };
  }
}

/**
 * Node for analyzing and fixing bugs.
 */
async function debugNode(state) {
  try {
    const filesSummary = Object.entries(state.files || {})
      .map(([path, content]) => `File: "${path}"\n\`\`\`\n${content}\n\`\`\``)
      .join('\n\n');

    const formattedMessages = [
      {
        role: 'system',
        content: `You are an expert debugging assistant. Identify the bug or layout error in the files and describe why it happens and how to fix it in simple terms.`
      },
      {
        role: 'user',
        content: `Bug/Error details: "${state.prompt}"\n\nCodebase files:\n${filesSummary}`
      }
    ];

    const result = await executeModelCall({
      agentRole: 'reviewer',
      messages: formattedMessages
    });

    return {
      ...state,
      explanation: result.text
    };
  } catch (error) {
    return {
      ...state,
      explanation: `Could not diagnose bug: ${error.message}`
    };
  }
}

/**
 * Node returning static off-topic gate redirect message.
 */
async function offTopicNode(state) {
  return {
    ...state,
    explanation: "I am focused strictly on frontend web development (HTML, CSS, JS, React, Tailwind). Try asking me to build a site, explain some code, or find and fix a bug!"
  };
}

// Router edge decision function
function routeIntent(state) {
  if (state.intent === 'off_topic') return 'off_topic';
  if (state.intent === 'explain') return 'explain';
  if (state.intent === 'debug') return 'debug';
  return 'planner';
}

// Planner edge decision function — Builder must never run with an invalid/missing spec
function routePlanning(state) {
  if (state.planningFailed) return 'end';
  return 'builder';
}

// Reviewer edge retry loop decision function
function routeReview(state) {
  if (state.approved || (state.retryCount || 0) > 1) {
    return 'end';
  }
  return 'builder';
}

// Construct state machine graph workflow
const workflow = new StateGraph(GraphState)
  .addNode('router', routerNode)
  .addNode('planner', plannerNode)
  .addNode('builder', builderNode)
  .addNode('reviewer', reviewerNode)
  .addNode('explain', explainNode)
  .addNode('debug', debugNode)
  .addNode('off_topic', offTopicNode)

  .addEdge(START, 'router')
  .addConditionalEdges('router', routeIntent, {
    off_topic: 'off_topic',
    explain: 'explain',
    debug: 'debug',
    planner: 'planner'
  })

  .addConditionalEdges('planner', routePlanning, {
    end: END,
    builder: 'builder'
  })

  .addEdge('builder', 'reviewer')
  .addConditionalEdges('reviewer', routeReview, {
    end: END,
    builder: 'builder'
  })
  
  .addEdge('explain', END)
  .addEdge('debug', END)
  .addEdge('off_topic', END);

const { compressHistory } = require('../utils/context');

const appGraph = workflow.compile();

/**
 * Executes the full agent pipeline for a given input.
 * @param {Object} input - Initial input containing user message, project state, and active stack.
 * @returns {Promise<Object>} Final state output from graph execution.
 */
async function runGraph(input) {
  const compressedHistory = await compressHistory(input.history || []);
  
  const result = await appGraph.invoke({
    prompt: input.prompt,
    files: input.files || {},
    stack: input.stack || 'vanilla',
    history: compressedHistory,
    retryCount: 0,
    errors: [],
    onProgress: input.onProgress,
  });
  return result;
}

module.exports = {
  runGraph,
};
