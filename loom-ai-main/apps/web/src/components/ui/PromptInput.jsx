/**
 * @file PromptInput.jsx
 * @description Premium rounded prompt input container with integrated Stack Selector toggle, Send, Upload, Attach buttons, and character counter.
 */

import React from 'react';
import { Send, Upload, Paperclip, Sparkles, Layers } from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { useUI } from '../../contexts/UIContext';
import { useChat } from '../../contexts/ChatContext';

export function PromptInput({ onSend, isGenerating = false }) {
  const { activeStack, setActiveStack } = useProject();
  const { setIsUploadModalOpen, showToast } = useUI();
  const { promptText, setPromptText } = useChat();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!promptText.trim() || isGenerating) return;
    if (onSend) {
      onSend(promptText, activeStack);
    }
  };

  return (
    <div className="w-full relative bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/10 rounded-3xl p-3.5 shadow-2xl focus-within:border-indigo-500/60 focus-within:ring-[3px] focus-within:ring-indigo-500/20 transition-all duration-300">
      {/* Input Textarea */}
      <textarea
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          activeStack === 'vanilla'
            ? 'Describe your Vanilla project or ask a question...'
            : 'Describe your React + Tailwind project or ask a question...'
        }
        rows={2}
        className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-[16px] font-medium resize-none focus:outline-none custom-scrollbar px-3 py-1.5 leading-relaxed"
        maxLength={2000}
      />

      {/* Toolbar Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
        {/* Left: Stack Selector & File Actions */}
        <div className="flex items-center gap-3 px-1">
          {/* Stack Toggle */}
          <div className="flex items-center bg-[#111] p-1 rounded-2xl border border-white/5 text-xs font-display">
            <button
              type="button"
              onClick={() => setActiveStack('vanilla')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                activeStack === 'vanilla'
                  ? 'bg-zinc-800 text-white font-bold shadow-md'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Vanilla</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStack('react-tailwind')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                activeStack === 'react-tailwind'
                  ? 'bg-zinc-800 text-white font-bold shadow-md'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>React</span>
            </button>
          </div>

          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="p-2.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-2xl transition-colors"
            title="Upload Project"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Attach Button */}
          <button
            type="button"
            onClick={() => showToast('Attach file snippet feature ready', 'info')}
            className="p-2.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-2xl transition-colors"
            title="Attach Snippet"
          >
            <Paperclip className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Character Counter & Send */}
        <div className="flex items-center gap-5 pr-1">
          <span className="text-xs text-zinc-600 font-mono font-medium">
            {promptText.length}/2000
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!promptText.trim() || isGenerating}
            className="p-3.5 bg-white hover:bg-zinc-200 text-black rounded-2xl shadow-xl hover:shadow-indigo-500/30 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 group"
            aria-label="Send Message"
          >
            <Send className="w-4 h-4 translate-x-[1px] translate-y-[1px] group-hover:text-indigo-600 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PromptInput;
