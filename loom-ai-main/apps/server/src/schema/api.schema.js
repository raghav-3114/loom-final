/**
 * @file api.schema.js
 * @description Zod schema definitions for API request and response envelopes, payload validation, and HTTP errors.
 */

const { z } = require('zod');

/** Schema for standard API response envelope */
const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
});

/** Schema for prompt execution API request */
const promptRequestSchema = z.object({
  prompt: z.string().min(1),
  projectId: z.string().optional(),
  stack: z.enum(['vanilla', 'react-tailwind']).optional(),
});

module.exports = {
  apiResponseSchema,
  promptRequestSchema,
};
