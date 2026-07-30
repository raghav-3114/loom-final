/**
 * @file LandingView.jsx
 * @description Minimal Claude-style landing view featuring centered LOOM wordmark, headline, subtitle, stack selector, prompt box, CTA buttons, and prompt chips.
 */

import React from 'react';
import { Sparkles, Upload, ArrowRight } from 'lucide-react';
import LoomLogo from '../ui/LoomLogo';
import PromptInput from '../ui/PromptInput';
import Button from '../ui/Button';
import { useUI } from '../../contexts/UIContext';
import { useChat } from '../../contexts/ChatContext';
import { useProject } from '../../contexts/ProjectContext';

export function LandingView() {
  const { setViewMode, setIsUploadModalOpen } = useUI();
  const { sendMessage, setPromptText, promptText } = useChat();
  const { activeStack } = useProject();

  const exampleChips = [
    { label: 'Build a Portfolio Website', prompt: 'Build a modern personal portfolio website with dark theme, smooth scroll navigation, project cards, and a contact form.' },
    { label: 'Create a SaaS Landing Page', prompt: 'Create a sleek SaaS landing page for an AI productivity app featuring hero section, feature grid, pricing table, and CTA footer.' },
    { label: 'Explain my React Component', prompt: 'Explain how React state and props work in my component in plain, beginner-friendly terms.' },
    { label: 'Debug my CSS Layout', prompt: 'Find and fix flexbox alignment and responsive layout overflow issues in my stylesheet.' },
  ];

  const handleChipClick = (chipPrompt) => {
    setPromptText(chipPrompt);
  };

  const handleGenerate = () => {
    if (!promptText.trim()) return;
    sendMessage(promptText, activeStack);
    setViewMode('workspace');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black text-white">
      {/* Premium Deep Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[40vh] bg-indigo-500/10 blur-[120px] rounded-full opacity-60 pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-0 right-0 w-[40vw] h-[40vh] bg-violet-600/10 blur-[140px] rounded-full opacity-40 pointer-events-none" />

      {/* Main Centered Content */}
      <div className="max-w-4xl w-full flex flex-col items-center text-center space-y-10 z-10 animate-fade-in mt-10">
        {/* Brand Wordmark */}
        <div className="flex items-center gap-3 mb-6 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-display font-bold tracking-[0.2em] text-zinc-200">LOOM AI</span>
        </div>

        {/* Headline & Subtitle */}
        <div className="space-y-6">
          <h1 className="text-6xl md:text-7xl font-display font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-zinc-500 leading-[1.1]">
            Build Frontend Projects <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">At Light Speed</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Generate, understand, and debug HTML, CSS, JavaScript, and React projects with an AI purpose-built for the modern web.
          </p>
        </div>

        {/* Prompt Input Box */}
        <div className="w-full max-w-3xl pt-6 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 to-violet-500/30 rounded-3xl blur-lg opacity-40 group-focus-within:opacity-100 transition-opacity duration-500" />
          <PromptInput onSend={() => handleGenerate()} />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-5 pt-4">
          <Button variant="primary" size="md" onClick={handleGenerate} className="font-display font-semibold rounded-full px-8 py-3 bg-white text-black hover:bg-zinc-200 shadow-xl hover:shadow-indigo-500/20 transition-all">
            <span>Start Building</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="glass" size="md" onClick={() => setIsUploadModalOpen(true)} className="font-display font-medium rounded-full px-8 py-3 border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all text-white">
            <Upload className="w-4 h-4 mr-2" />
            <span>Upload Existing Project</span>
          </Button>
        </div>

        {/* Prompt Suggestion Chips */}
        <div className="w-full pt-12 space-y-5">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {exampleChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(chip.prompt)}
                className="px-5 py-2.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-500/40 text-[13px] font-semibold text-zinc-400 hover:text-white transition-all flex items-center gap-2 group backdrop-blur-md shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 group-hover:text-indigo-400 transition-colors" />
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingView;
