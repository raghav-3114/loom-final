/**
 * @file useProject.js
 * @description Custom React hook providing access to ProjectContext state and workspace file manipulations.
 */

import { useContext } from 'react';
import { ProjectContext } from '../contexts/ProjectContext.jsx';

/**
 * Hook to consume ProjectContext values.
 * @returns {object} Project context state, stack settings ("vanilla" or "react-tailwind"), and file handlers.
 */
export function useProject() {
  return useContext(ProjectContext);
}

export default useProject;
