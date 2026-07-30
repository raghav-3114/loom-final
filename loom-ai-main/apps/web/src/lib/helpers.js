/**
 * @file helpers.js
 * @description Helper functions for text formatting, stack detection ("vanilla" vs "react-tailwind"), and file tree processing.
 */

export const STACK_TYPES = {
  VANILLA: 'vanilla',
  REACT_TAILWIND: 'react-tailwind',
};

/**
 * Formats file paths for consistent display across UI components.
 * @param {string} filePath - Input relative or absolute file path.
 * @returns {string} Sanitized file path string.
 */
export function formatFilePath(filePath) {
  return filePath ? filePath.replace(/\\/g, '/') : '';
}

export default { STACK_TYPES, formatFilePath };
