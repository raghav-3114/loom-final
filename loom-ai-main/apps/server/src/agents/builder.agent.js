/**
 * Builder Agent node for code generation and modifications.
 * Dispatches to stack-specific prompt templates and returns structured JSON instructions.
 */

const fs = require('fs');
const path = require('path');
const { getVanillaSystemPrompt, getVanillaBuilderPrompt } = require('../stacks/vanilla/prompts');
const { getReactTailwindSystemPrompt, getReactTailwindBuilderPrompt } = require('../stacks/react-tailwind/prompts');
const { executeModelCall } = require('../providers/provider-manager');
const { repairJson } = require('../utils/json-repair');

const VANILLA_BASE_CSS = fs.readFileSync(path.join(__dirname, '../stacks/vanilla/base.css'), 'utf8');
const VANILLA_BASE_CSS_MARKER = '=== LOOM_BASE_DESIGN_SYSTEM ===';

/**
 * Ensures style.css always starts with the shared design-token base layer,
 * regardless of whether the model included/preserved it. Idempotent — skips
 * if the marker is already present so repeated edits don't duplicate it.
 */
function ensureVanillaBaseCss(updatedFiles) {
  const current = updatedFiles['style.css'];
  if (typeof current !== 'string') return;
  if (current.includes(VANILLA_BASE_CSS_MARKER)) return;
  updatedFiles['style.css'] = `${VANILLA_BASE_CSS}\n${current}`;
}

/**
 * Strips a leading HTML-style comment (<!-- ... -->) that some models
 * mistakenly prepend before the first real line of JS/JSX code — this is
 * an ES-module syntax error and breaks Sandpack bundling. Only matches
 * literal `<!-- -->` blocks anchored at the very start of the file (after
 * whitespace); never touches line comments or block comments written in
 * JS/JSDoc syntax, or any HTML comment that appears later in the file
 * (e.g. inside JSX markup or string literals).
 */
function stripLeadingHtmlComment(content) {
  return content.replace(/^\s*(?:<!--[\s\S]*?-->\s*)+/, '');
}

/**
 * Generates or modifies project files using structured actions.
 * @param {Object} state - Graph state containing files, prompt, stack, and reviewer feedback.
 * @returns {Promise<Object>} Updated graph state.
 */
async function builderNode(state) {
  try {
    state.onProgress?.('Writing the project files and implementation details...');
    const isVanilla = state.stack === 'vanilla';
    const systemPrompt = isVanilla ? getVanillaSystemPrompt() : getReactTailwindSystemPrompt();

    // Trust the Planner: build from its normalized/expanded request (e.g. "Create Netflix" ->
    // the fully-scoped restatement) when available, instead of the user's raw, possibly-vague prompt.
    const effectivePrompt = (state.designSpec && state.designSpec.normalizedRequest) || state.prompt;
    const builderPrompt = isVanilla ? getVanillaBuilderPrompt(effectivePrompt) : getReactTailwindBuilderPrompt(effectivePrompt);

    // Build files context
    const filesContext = Object.entries(state.files || {})
      .map(([path, content]) => `File: "${path}"\n\`\`\`\n${content}\n\`\`\``)
      .join('\n\n');

    let userMessage = `${builderPrompt}\n\nCurrent Project Files Context:\n${filesContext || 'No files created yet.'}`;

    // Inject the Planner's Design Specification — the authoritative implementation plan.
    // Builder must implement it precisely rather than inventing a different architecture; never shown to the user.
    if (state.designSpec) {
      userMessage += `\n\n[INTERNAL DESIGN SPECIFICATION — this is the authoritative plan produced by the Design Planner. Implement its sections, component list, navigation style, color palette, and layout strategy precisely. Do not invent a different architecture, and do not mention this specification to the user]:\n${JSON.stringify(state.designSpec, null, 2)}`;
    }

    // Append reviewer feedback if builder is running on a retry loop
    if (state.issues && state.issues.length > 0) {
      const issuesText = state.issues.map((i, idx) => `${idx + 1}. File "${i.file}": ${i.issue} (Suggestion: ${i.suggestion})`).join('\n');
      userMessage += `\n\n[REVIEW FEEDBACK]: The previous build was rejected due to the following issues. Correct them immediately:\n${issuesText}`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    const result = await executeModelCall({
      agentRole: 'builder',
      messages,
      responseFormat: { type: 'json_object' }
    });

    console.log('[BuilderAgent] Raw LLM text:', result.text);

    let buildResult = { reasoning: '', summary: '', actions: [] };
    try {
      buildResult = repairJson(result.text);
    } catch (e) {
      console.error('[BuilderAgent] Failed to parse generated JSON. Raw text:', result.text);
      throw new Error(`Builder returned malformed JSON: ${e.message}`);
    }

    // Apply file actions to the state files map
    const updatedFiles = { ...(state.files || {}) };
    const CONFIG_FILENAMES = ['tailwind.config.js', 'postcss.config.js', 'vite.config.js'];

    if (buildResult.actions && Array.isArray(buildResult.actions)) {
      for (const change of buildResult.actions) {
        let { action, path, content } = change;

        // React component files must use .jsx, never .js (config files are exempt)
        if (!isVanilla && path && path.endsWith('.js') && !CONFIG_FILENAMES.includes(path.replace(/^\//, ''))) {
          path = `${path.slice(0, -3)}.jsx`;
        }

        if (action === 'delete') {
          delete updatedFiles[path];
        } else if (action === 'create' || action === 'update') {
          if (typeof content !== 'string') {
            throw new Error(`File action "${action}" for path "${path}" is missing valid string content.`);
          }
          if (path && (path.endsWith('.jsx') || path.endsWith('.js'))) {
            content = stripLeadingHtmlComment(content);
          }
          updatedFiles[path] = content;
        }
      }
    }

    if (isVanilla) {
      ensureVanillaBaseCss(updatedFiles);
    }

    return {
      ...state,
      files: updatedFiles,
      reasoning: buildResult.reasoning,
      summary: buildResult.summary,
      actions: buildResult.actions,
      issues: null,
      errors: [], // Clear any previous errors on success
    };
  } catch (error) {
    console.error('[BuilderAgent] Error:', error);
    return {
      ...state,
      errors: [...(state.errors || []), `Builder failed: ${error.message}`],
    };
  }
}

module.exports = {
  builderNode,
};
