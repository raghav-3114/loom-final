/**
 * @file json-repair.js
 * @description Resilient, syntax-only JSON parser for model output. It can
 * unwrap markdown and close a response cut off at the end, but never invents
 * missing values or source code.
 */

function unwrapMarkdown(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (fenced ? fenced[1] : text).trim();
}

/** Remove commas immediately before a closing JSON token, ignoring strings. */
function removeTrailingCommas(text) {
  let output = '';
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === ',') {
      const remainder = text.slice(index + 1);
      const next = remainder.match(/^\s*([}\]])/);
      if (next) continue;
    }
    output += char;
  }

  return output;
}

/**
 * Finds the first complete JSON object/array without treating braces or
 * quotes in JSON string values (such as JavaScript/CSS source) as structure.
 */
function findCompleteJsonValue(text) {
  const start = text.search(/[\[{]/);
  if (start === -1) return null;

  const stack = [];
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === '{') {
      stack.push('}');
    } else if (char === '[') {
      stack.push(']');
    } else if (char === '}' || char === ']') {
      if (stack.pop() !== char) return null;
      if (stack.length === 0) return text.slice(start, index + 1);
    }
  }
  return null;
}

/**
 * Closes only an end-truncated JSON document. Braces and brackets contained
 * in generated file contents are ignored because they occur inside strings.
 */
function closeTruncatedJson(text) {
  const start = text.search(/[\[{]/);
  if (start === -1) throw new Error('No JSON object or array found in model output');

  let candidate = text.slice(start).trim();
  const stack = [];
  let inString = false;
  let escaped = false;

  for (const char of candidate) {
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') stack.push('}');
    else if (char === '[') stack.push(']');
    else if (char === '}' || char === ']') {
      if (stack.pop() !== char) throw new Error('Model output has mismatched JSON closing tokens');
    }
  }

  if (inString) {
    // A final backslash would escape the closing quote. Add its mate first.
    if (escaped) candidate += '\\';
    candidate += '"';
  }
  return candidate + stack.reverse().join('');
}

/**
 * Extracts and repairs malformed JSON syntax.
 * @param {string} rawText Input string containing JSON.
 * @returns {Object} Parsed JSON object.
 * @throws {Error} If JSON syntax is completely unrecoverable.
 */
function repairJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Input text is empty or invalid type');
  }

  const cleaned = unwrapMarkdown(rawText);
  const completeValue = findCompleteJsonValue(cleaned);
  const candidates = [cleaned, completeValue].filter(Boolean).map(removeTrailingCommas);
  try {
    candidates.push(removeTrailingCommas(closeTruncatedJson(cleaned)));
  } catch (error) {
    // A complete response can still parse even when unrelated trailing text
    // cannot be interpreted as an end-truncated JSON document.
  }

  let lastError;
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`JSON syntax is unrecoverable. Detail: ${lastError?.message || 'Unable to parse model output'}`);
}

module.exports = { repairJson };
