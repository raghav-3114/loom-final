/**
 * @file ChatPanel.jsx
 * @description Main conversation stream container for displaying message bubbles, streaming thinking indicators, and bottom prompt input.
 */

import React, { useEffect, useRef } from 'react';
import { Sparkles, Bot } from 'lucide-react';
import MessageBubble from './MessageBubble';
import PromptInput from '../ui/PromptInput';
import { useChat } from '../../contexts/ChatContext';

export function ChatPanel() {
  const { messages, sendMessage, isGenerating, thinkingStep } = useChat();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating, thinkingStep]);

  return (
    <div className="h-full flex flex-col justify-between bg-black relative overflow-hidden">
      {/* Scrollable Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar max-w-4xl mx-auto w-full relative z-10">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            // Never re-submit error text as a new user turn — error messages have no regenerate
            onRegenerate={msg.isError ? null : () => sendMessage(msg.content)}
          />
        ))}

        {/* Thinking / Streaming Indicator */}
        {isGenerating && (
          <div className="flex items-start gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md shadow-xl animate-pulse relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mt-1 ring-1 ring-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
              <Bot className="w-5 h-5 animate-spin" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 font-display font-bold text-indigo-300 text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Generating Intelligence...</span>
              </div>
              <p className="text-[13px] text-zinc-400 font-mono tracking-wide leading-relaxed">{thinkingStep || 'Processing response...'}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Sticky Prompt Input */}
      <div className="p-4 bg-transparent backdrop-blur-2xl relative z-20">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-4xl mx-auto w-full relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-3xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
          <PromptInput onSend={(text, stack) => sendMessage(text, stack)} isGenerating={isGenerating} />
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
