/**
 * @file project.schema.js
 * @description Zod schema definitions for project state, file trees, file metadata, and project configurations.
 */

const { z } = require('zod');

/** Schema for individual project file structure */
const projectFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  type: z.enum(['file', 'directory']).default('file'),
});

/** Schema for full project state representation */
const projectStateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  stack: z.enum(['vanilla', 'react-tailwind']),
  files: z.array(projectFileSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

module.exports = {
  projectFileSchema,
  projectStateSchema,
};
