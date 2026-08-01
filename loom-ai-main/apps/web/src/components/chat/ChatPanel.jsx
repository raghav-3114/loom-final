/**
 * @file ChatPanel.jsx
 * @description Main conversation stream container for displaying message bubbles, streaming thinking indicators,
 * centered landing hero with cursive branding, pills, and bottom input.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Bot, Code, Bug, PenTool, Eye } from 'lucide-react';
import MessageBubble from './MessageBubble';
import PromptInput from '../ui/PromptInput';
import LoomLogo from '../ui/LoomLogo';
import { useChat } from '../../contexts/ChatContext';
import { useProject } from '../../contexts/ProjectContext';

const TAGLINE = 'Build, Debug & Learn...';

export function ChatPanel() {
  const { messages, sendMessage, isGenerating, thinkingStep, setPromptText } = useChat();
  const { files } = useProject();
  const messagesEndRef = useRef(null);
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  const hasProjectFiles = Object.keys(files).length > 0;
  const isLandingState = messages.length === 1 && !hasProjectFiles;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isLandingState) scrollToBottom();
  }, [messages, isGenerating, thinkingStep, isLandingState]);

  // Looping typewriter effect: type → pause → erase → pause → repeat
  useEffect(() => {
    if (!isLandingState) return;
    let cancelled = false;
    const TYPE_SPEED = 70;
    const ERASE_SPEED = 40;
    const PAUSE_AFTER_TYPE = 1800;
    const PAUSE_AFTER_ERASE = 500;

    async function sleep(ms) {
      return new Promise((r) => setTimeout(r, ms));
    }

    async function loop() {
      while (!cancelled) {
        // Type forward
        for (let i = 1; i <= TAGLINE.length; i++) {
          if (cancelled) return;
          setTypedText(TAGLINE.slice(0, i));
          await sleep(TYPE_SPEED);
        }
        await sleep(PAUSE_AFTER_TYPE);
        // Erase backward
        for (let i = TAGLINE.length - 1; i >= 0; i--) {
          if (cancelled) return;
          setTypedText(TAGLINE.slice(0, i));
          await sleep(ERASE_SPEED);
        }
        await sleep(PAUSE_AFTER_ERASE);
      }
    }

    loop();
    return () => { cancelled = true; };
  }, [isLandingState]);

  const handleChipClick = (chipPrompt) => {
    setPromptText(chipPrompt);
  };

  return (
    <div className="h-full flex flex-col justify-between chat-panel-shell relative overflow-hidden">
      {isLandingState ? (
        /* Centered landing hero — shown before the first prompt */
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 flex flex-col items-center justify-center p-6 md:p-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[40vh] bg-indigo-500/10 blur-[120px] rounded-full opacity-60 pointer-events-none animate-pulse-slow" />
          <div className="absolute bottom-0 right-0 w-[40vw] h-[40vh] bg-violet-600/10 blur-[140px] rounded-full opacity-40 pointer-events-none" />

          <div className="max-w-4xl w-full flex flex-col items-center text-center space-y-8 animate-fade-in relative z-10">
            {/* Exact logo from reference image */}
            <div className="flex flex-col items-center select-none">
              <LoomLogo size="hero" />
              <h1
                className="text-2xl md:text-3xl font-medium text-[var(--text-secondary)] mt-4 h-[1.4em]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.02em' }}
              >
                {typedText}
                <span className="inline-block w-[2px] h-[0.85em] bg-[var(--accent-purple)] ml-0.5 align-middle rounded-full animate-pulse" />
              </h1>
            </div>
            {/* Prompt input container */}
            <div className="w-full relative group text-left max-w-2xl">
              <PromptInput onSend={(text, stack) => sendMessage(text, stack)} isGenerating={isGenerating} />
            </div>

            {/* Suggestions Chips underneath input */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 max-w-2xl">
              {[
                { label: 'Generate Website', prompt: 'Generate a sleek SaaS landing page for an AI productivity app featuring hero section, feature grid, pricing table, and CTA footer.' },
                { label: 'Explain Code', prompt: 'Explain how React state and props work in this component in plain, beginner-friendly terms.' },
                { label: 'Debug Project', prompt: 'Find and fix flexbox alignment and responsive layout overflow issues in my stylesheet.' },
                { label: 'React', prompt: 'Build a modern personal portfolio website in React with dark theme, smooth scroll navigation, and contact form.' },
                { label: 'HTML', prompt: 'Build a standard, clean responsive HTML5 grid layout for a blog index.' },
                { label: 'CSS', prompt: 'Write a modern responsive flexbox style for navigation header with menu toggles.' },
                { label: 'JavaScript', prompt: 'Write a vanilla JavaScript search filter function that filters cards based on search input value.' },
                { label: 'Tailwind', prompt: 'Create a modern login form component using Tailwind CSS utility classes.' }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChipClick(chip.prompt)}
                  className="px-4 py-2 rounded-full bg-black/5 theme-dark:bg-white/[0.02] border border-black/5 theme-dark:border-white/5 hover:border-indigo-500/40 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-2 group backdrop-blur-md shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500/50 group-hover:text-indigo-400 transition-colors" />
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Scrollable Conversation Stream */
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar max-w-4xl mx-auto w-full relative z-10">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onRegenerate={msg.isError ? null : () => sendMessage(msg.content)}
            />
          ))}

          {/* Thinking / Streaming Indicator */}
          {isGenerating && (
            <div className="flex items-start gap-4 p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] backdrop-blur-md shadow-xl animate-pulse relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mt-1 ring-1 ring-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <Bot className="w-5 h-5 animate-spin" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 font-display font-bold text-indigo-500 theme-dark:text-indigo-300 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Generating Intelligence...</span>
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] font-mono tracking-wide leading-relaxed">{thinkingStep || 'Processing response...'}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Bottom Sticky Prompt Input — ONLY in active chat state */}
      {!isLandingState && (
        <div className="p-4 bg-transparent backdrop-blur-2xl relative z-20">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="max-w-4xl mx-auto w-full relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-3xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
            <PromptInput onSend={(text, stack) => sendMessage(text, stack)} isGenerating={isGenerating} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPanel;
