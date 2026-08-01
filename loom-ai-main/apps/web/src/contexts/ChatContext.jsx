/**
 * @file ChatContext.jsx
 * @description Context for managing chat message history, active input text, streaming state, and SSE stream parser.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useProject } from './ProjectContext';

const ChatContext = createContext(null);

const INITIAL_MESSAGES = [];

export function ChatProvider({ children }) {
  const { setFiles, setProjectTitle, activeStack, setActiveStack, resetProject } = useProject();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [promptText, setPromptText] = useState('');
  const [generatingProjects, setGeneratingProjects] = useState({});
  const [thinkingSteps, setThinkingSteps] = useState({});
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [conversationVersion, setConversationVersion] = useState(0);
  const activeProjectIdRef = useRef(activeProjectId);
  const draftProjectIdsRef = useRef(new Set());

  useEffect(() => {
    activeProjectIdRef.current = activeProjectId;
  }, [activeProjectId]);

  const setProjectGenerating = useCallback((projectId, generating, step = null) => {
    if (!projectId) return;
    setGeneratingProjects((current) => ({ ...current, [projectId]: generating }));
    if (step !== null) setThinkingSteps((current) => ({ ...current, [projectId]: step }));
    if (!generating) setThinkingSteps((current) => ({ ...current, [projectId]: null }));
  }, []);

  const isGenerating = Boolean(activeProjectId && generatingProjects[activeProjectId]);
  const thinkingStep = activeProjectId ? thinkingSteps[activeProjectId] : null;

  const sendMessage = useCallback(async (text, stack = activeStack) => {
    if (!text || !text.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      stack,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const initialProjectId = activeProjectId;
    let targetProjectId = initialProjectId;
    setMessages((prev) => [...prev, userMsg]);
    setPromptText('');
    if (targetProjectId) setProjectGenerating(targetProjectId, true, 'Analyzing stack requirements and classifying intent...');

    const isNew = !targetProjectId || draftProjectIdsRef.current.has(targetProjectId);
    const endpoint = isNew ? '/api/generate' : '/api/chat';
    const payload = isNew
      ? { prompt: text, stack, ...(targetProjectId ? { projectId: targetProjectId } : {}) }
      : { message: text, projectId: targetProjectId, stack };

    // Matches the "missing valid string content" malformed-JSON signature
    // from a flaky fallback provider — safe to retry once client-side.
    // This is purely a UX safety net; it never touches the server's own
    // bounded Reviewer retry loop.
    const isRetryableProviderGlitch = (message) =>
      /missing valid string content/i.test(message || '');

    // Runs a single generate/chat attempt end-to-end. Throws on any
    // failure so the caller can decide whether to retry or surface it.
    const attemptRequest = async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const rawBody = await response.text();
        let body = null;
        try {
          body = rawBody ? JSON.parse(rawBody) : null;
        } catch {
          body = null;
        }
        const message = body?.error?.message || body?.error || rawBody ||
          `The AI backend did not respond. Start the server on port 3001 and configure a provider API key.`;
        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Flag to propagate SSE-level errors to the outer catch
      let sseError = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (sseError) break; // stop reading if a server error event was received

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep remainder

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('data: ')) {
            const rawData = cleanLine.substring(6);
            // Parse JSON safely — only catch actual parse failures here
            let data;
            try {
              data = JSON.parse(rawData);
            } catch (e) {
              console.warn('[SSE Parser] JSON parse warning:', e);
              continue; // skip malformed SSE frames
            }

            // Handle event types outside the JSON-parse try so errors escape cleanly
            if (data.type === 'thinking') {
              if (targetProjectId) setProjectGenerating(targetProjectId, true, data.message);
            } else if (data.type === 'project') {
              targetProjectId = data.projectId;
              setProjectGenerating(targetProjectId, true, 'Analyzing stack requirements and classifying intent...');
              setConversationVersion((version) => version + 1);
              if (activeProjectIdRef.current === initialProjectId) {
                setActiveProjectId(targetProjectId);
                setProjectTitle(text.substring(0, 30));
              }
            } else if (data.type === 'error') {
              // Record and break — will be thrown after the read loop exits
              sseError = new Error(data.message);
              break;
            } else if (data.type === 'done') {
              // Done event contains complete files & explanation
              targetProjectId = data.projectId;
              draftProjectIdsRef.current.delete(targetProjectId);
              setConversationVersion((version) => version + 1);
              setProjectGenerating(targetProjectId, false);

              // A background job must never overwrite the project now visible.
              if (activeProjectIdRef.current !== targetProjectId) continue;

              setActiveProjectId(data.projectId);

              // Explain/debug/off_topic are read-only — never reset file state
              const isReadOnly = data.intent === 'explain' || data.intent === 'debug' || data.intent === 'off_topic';
              if (!isReadOnly && data.files && Object.keys(data.files).length > 0) {
                setFiles(data.files);
              }

              // If it is new project, update project title
              if (isNew) {
                setProjectTitle(text.substring(0, 30));
              }

              const assistantMsg = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                stack,
                content: data.explanation || `I've updated the **${stack === 'vanilla' ? 'Vanilla' : 'React + Tailwind'}** files based on your request.`,
                summary: data.summary,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };

              setMessages((prev) => [...prev, assistantMsg]);
            }
          }
        }
      }

      // Propagate any SSE-level error to the outer catch
      if (sseError) throw sseError;
    };

    try {
      try {
        await attemptRequest();
      } catch (error) {
        // Exactly one automatic client-side retry, only for this specific
        // provider-glitch signature — any other error (or a second failure
        // of the same kind) falls through to the normal error message below.
        if (isRetryableProviderGlitch(error.message)) {
          console.warn('[ChatContext] Retryable provider glitch, retrying once:', error.message);
          if (targetProjectId) setProjectGenerating(targetProjectId, true, 'The AI provider returned an invalid response — retrying...');
          await attemptRequest();
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('[ChatContext] Streaming Error:', error);
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        isError: true,
        content: `Error: ${error.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      if (activeProjectIdRef.current === targetProjectId) setMessages((prev) => [...prev, errorMsg]);
    } finally {
      if (targetProjectId) setProjectGenerating(targetProjectId, false);
    }
  }, [activeStack, activeProjectId, setFiles, setProjectGenerating, setProjectTitle]);

  const clearChat = useCallback(() => {
    setMessages(INITIAL_MESSAGES);
    setActiveProjectId(null);
    setPromptText('');
    resetProject();
  }, [resetProject]);

  const startNewChat = useCallback(async () => {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stack: 'vanilla' }),
    });
    const body = await response.json();
    if (!response.ok || !body.success) {
      throw new Error(body.error || 'Unable to create a new chat');
    }

    draftProjectIdsRef.current.add(body.project.id);
    resetProject();
    setMessages(INITIAL_MESSAGES);
    setPromptText('');
    setActiveProjectId(body.project.id);
    setConversationVersion((version) => version + 1);
    return body.project.id;
  }, [resetProject]);

  // Poll active project status if it is currently generating ('building')
  useEffect(() => {
    if (!activeProjectId) return;

    let intervalId = null;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/conversations/${encodeURIComponent(activeProjectId)}`);
        const body = await response.json();
        if (response.ok && body.success) {
          const { project, state } = body;
          
          if (project.status === 'building') {
            setGeneratingProjects((current) => {
              if (current[activeProjectId]) return current;
              return { ...current, [activeProjectId]: true };
            });
            setThinkingSteps((current) => {
              if (current[activeProjectId]) return current;
              return { ...current, [activeProjectId]: 'AI is processing project generation in background...' };
            });
          } else {
            // Completed or error state
            setGeneratingProjects((current) => {
              if (!current[activeProjectId]) return current;
              return { ...current, [activeProjectId]: false };
            });
            setThinkingSteps((current) => {
              if (!current[activeProjectId]) return current;
              return { ...current, [activeProjectId]: null };
            });

            // Update files and messages with completed project state
            setFiles(state.files || {});
            setMessages(state.messages?.length ? state.messages : INITIAL_MESSAGES);
            setConversationVersion((v) => v + 1);

            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
          }
        }
      } catch (err) {
        console.warn('[ChatContext] Polling status failed:', err);
      }
    };

    // Run immediately when loaded/switched
    checkStatus();

    // Check status every 1.5 seconds
    intervalId = setInterval(checkStatus, 1500);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeProjectId, setFiles]);

  const loadConversation = useCallback(async (projectId) => {
    const response = await fetch(`/api/conversations/${encodeURIComponent(projectId)}`);
    const body = await response.json();
    if (!response.ok || !body.success) {
      throw new Error(body.error || 'Unable to load conversation');
    }

    const { project, state } = body;
    if (project.status === 'draft') draftProjectIdsRef.current.add(project.id);
    else draftProjectIdsRef.current.delete(project.id);
    setActiveStack(project.stack);
    setProjectTitle(project.name);
    setFiles(state.files || {});
    setMessages(state.messages?.length ? state.messages : INITIAL_MESSAGES);

    if (project.status === 'building') {
      setGeneratingProjects((current) => ({ ...current, [projectId]: true }));
      setThinkingSteps((current) => ({ ...current, [projectId]: 'AI is processing project generation in background...' }));
    } else {
      setGeneratingProjects((current) => ({ ...current, [projectId]: false }));
      setThinkingSteps((current) => ({ ...current, [projectId]: null }));
    }

    setActiveProjectId(project.id);
    setPromptText('');
  }, [setActiveStack, setFiles, setProjectTitle]);

  // Memoized so the context value only changes reference when actual chat
  // state changes — otherwise every consumer (including components that only
  // need e.g. activeProjectId) re-renders on every keystroke typed into the
  // prompt box, cascading into anything downstream that isn't memoized.
  const value = useMemo(() => ({
    messages,
    promptText,
    setPromptText,
    isGenerating,
    thinkingStep,
    sendMessage,
    clearChat,
    startNewChat,
    activeProjectId,
    setActiveProjectId,
    loadConversation,
    conversationVersion,
  }), [messages, promptText, isGenerating, thinkingStep, sendMessage, clearChat, startNewChat, activeProjectId, loadConversation, conversationVersion]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export { ChatContext };
export default ChatContext;
