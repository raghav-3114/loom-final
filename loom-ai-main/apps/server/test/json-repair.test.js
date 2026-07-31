const test = require('node:test');
const assert = require('node:assert/strict');
const { repairJson } = require('../src/utils/json-repair');

test('repairs a response truncated inside generated source code', () => {
  const truncated = '{"actions":[{"action":"create","path":"script.js","content":"const template = `value: ${item}`;\\nfunction init() { return { ready: true }; }\\nconsole.log(\\\"incomplete';
  const result = repairJson(truncated);

  assert.equal(result.actions[0].path, 'script.js');
  assert.match(result.actions[0].content, /console\.log/);
});

test('does not remove comma-plus-brace text inside generated file content', () => {
  const result = repairJson('{"actions":[{"content":"literal ,} text"}]}');
  assert.equal(result.actions[0].content, 'literal ,} text');
});
