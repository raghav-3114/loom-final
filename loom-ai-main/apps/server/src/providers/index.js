/**
 * @file index.js
 * @description Re-exports the unified provider manager interface for consumption by agents and app workflows.
 */

const { executeModelCall } = require('./provider-manager');

module.exports = {
  executeModelCall,
};
