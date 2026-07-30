/**
 * @file json-repair.js
 * @description Resilient, syntax-only JSON parser. Extracts JSON from markdown envelopes
 * and fixes minor truncation syntax errors (missing brackets, trailing commas, unclosed quotes).
 * NEVER invents or hallucinates content, files, or code.
 */

/**
 * Extracts and repairs malformed JSON syntax.
 * @param {string} rawText - Input string containing JSON.
 * @returns {Object} Parsed JSON object.
 * @throws {Error} If JSON syntax is completely unrecoverable.
 */
function repairJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Input text is empty or invalid type');
  }

  let cleaned = rawText.trim();

  // 1. Extract from markdown code block fences if present
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/i;
  const match = cleaned.match(jsonBlockRegex);
  if (match) {
    cleaned = match[1].trim();
  } else {
    // Check for general markdown fences if json label is omitted
    const genericBlockRegex = /```\s*([\s\S]*?)\s*```/;
    const genericMatch = cleaned.match(genericBlockRegex);
    if (genericMatch) {
      cleaned = genericMatch[1].trim();
    }
  }

  // 2. Fix trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // 3. Attempt simple parse first
  try {
    return JSON.parse(cleaned);
  } catch (initialError) {
    // 4. Syntactical repair for truncated streams (closed quotes, braces, brackets)
    let repaired = cleaned;
    
    // If the last character is a partial string literal, close the quote
    const openQuotesCount = (repaired.match(/"/g) || []).length;
    if (openQuotesCount % 2 !== 0) {
      repaired += '"';
    }

    // Balance open/close curly braces and brackets
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    if (openBrackets > closeBrackets) {
      repaired += ']'.repeat(openBrackets - closeBrackets);
    }
    if (openBraces > closeBraces) {
      repaired += '}'.repeat(openBraces - closeBraces);
    }

    try {
      return JSON.parse(repaired);
    } catch (secondaryError) {
      throw new Error(`JSON syntax is unrecoverable. Detail: ${secondaryError.message}`);
    }
  }
}

module.exports = {
  repairJson,
};
