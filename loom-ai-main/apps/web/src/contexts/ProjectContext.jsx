/**
 * @file ProjectContext.jsx
 * @description Context managing active project stack ("vanilla" | "react-tailwind"), project files, and active file state.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  // "vanilla" | "react-tailwind"
  const [activeStack, setActiveStack] = useState('vanilla');
  const [projectTitle, setProjectTitle] = useState('Untitled Project');
  // Start empty — Live Preview should show its standby state until the
  // user actually generates or uploads a project, never a placeholder mock.
  const [files, setFiles] = useState({});
  const [activeFileName, setActiveFileName] = useState(null);

  // Stable across renders (only calls stable useState setters) — safe to
  // memoize unconditionally so consumers never see a new function identity.
  const switchStack = useCallback((stack) => {
    setActiveStack(stack);
    setFiles({});
    setActiveFileName(null);
  }, []);

  const resetProject = useCallback(() => {
    setActiveStack('vanilla');
    setProjectTitle('Untitled Project');
    setFiles({});
    setActiveFileName(null);
  }, []);

  // Memoized so the context value only changes reference when the actual
  // project data changes — otherwise every consumer (including the Live
  // Preview renderers) re-renders on every ProjectProvider render, which
  // for Sandpack-based previews means a full sandbox reset.
  const value = useMemo(() => ({
    activeStack,
    setActiveStack: switchStack,
    resetProject,
    projectTitle,
    setProjectTitle,
    files,
    setFiles,
    activeFileName,
    setActiveFileName,
  }), [activeStack, switchStack, resetProject, projectTitle, files, activeFileName]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

export { ProjectContext };
export default ProjectContext;
