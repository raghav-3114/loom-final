/**
 * @file PromptInput.jsx
 * @description Premium rounded prompt input container with integrated Stack Selector, functional voice typing, and background upload.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Mic, MicOff, ArrowUp } from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { useUI } from '../../contexts/UIContext';
import { useChat } from '../../contexts/ChatContext';
import { uploadProject } from '../../lib/apiClient';

export function PromptInput({ onSend, isGenerating = false }) {
  const { activeStack, setActiveStack, setFiles } = useProject();
  const { showToast } = useUI();
  const { promptText, setPromptText, setActiveProjectId } = useChat();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize SpeechRecognition API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setPromptText((prev) => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('[SpeechRecognition] Error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showToast('Microphone access denied. Enable permissions in your browser.', 'error');
        } else {
          showToast(`Voice input error: ${event.error}`, 'error');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [setPromptText, showToast]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showToast('Voice typing is not supported in this browser. Try Google Chrome or Microsoft Edge.', 'warning');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      showToast('Voice typing stopped.', 'info');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        showToast('Listening... Speak now.', 'info');
      } catch (err) {
        console.error('[SpeechRecognition] Failed to start:', err);
      }
    }
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    showToast('Importing project...', 'info');

    try {
      let response;
      const isZip = selectedFiles.length === 1 && selectedFiles[0].name.endsWith('.zip');

      // Detect stack
      let detectedStack = 'auto';
      if (!isZip) {
        if (selectedFiles.length === 1) {
          const file = selectedFiles[0];
          const isReact = file.name.includes('react') || file.name.endsWith('.jsx') || file.name.includes('tailwind');
          detectedStack = isReact ? 'react-tailwind' : 'vanilla';
        } else {
          const hasReact = selectedFiles.some(file => 
            file.name.includes('App.js') || 
            file.name.includes('App.jsx') || 
            file.name.includes('tailwind.config.js')
          );
          detectedStack = hasReact ? 'react-tailwind' : 'vanilla';
        }
      }

      if (isZip) {
        const formData = new FormData();
        formData.append('file', selectedFiles[0]);
        response = await uploadProject(formData);
      } else {
        const uploadFiles = {};
        for (const file of selectedFiles) {
          const content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target?.result || '');
            reader.onerror = (err) => reject(err);
            reader.readAsText(file);
          });
          uploadFiles[file.name] = content;
        }

        if (selectedFiles.length === 1) {
          const singleFile = selectedFiles[0];
          if (detectedStack === 'vanilla' && singleFile.name === 'index.html') {
            uploadFiles['style.css'] = `/* Generated style */\nbody { background: #0b0b0e; color: #f8fafc; }`;
            uploadFiles['script.js'] = `// Generated script\nconsole.log('App loaded');`;
          } else if (detectedStack === 'react-tailwind' && (singleFile.name.endsWith('.jsx') || singleFile.name.endsWith('.js'))) {
            const filename = singleFile.name.endsWith('.jsx') ? 'App.jsx' : 'App.js';
            uploadFiles[filename] = uploadFiles[singleFile.name];
          }
        }

        response = await uploadProject(uploadFiles);
      }

      // Update context and switch project workspace
      setActiveStack(response.data.stack);
      setFiles(response.data.files);
      setActiveProjectId(response.data.projectId);
      showToast(response.data.message || 'Project imported successfully!', 'success');
    } catch (err) {
      console.error('[PromptInput] Import failed:', err);
      showToast(`Import failed: ${err.message}`, 'warning');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!promptText.trim() || isGenerating) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (onSend) {
      onSend(promptText, activeStack);
    }
  };

  const hasContent = promptText.trim().length > 0;

  return (
    <div className="w-full relative bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-3.5 shadow-2xl focus-within:border-indigo-500/50 transition-all duration-300">
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
        rows={1}
        className="w-full bg-transparent text-[var(--text-primary)] placeholder-slate-500 text-[15px] font-medium resize-none focus:outline-none custom-scrollbar px-3 py-1.5 leading-relaxed"
        maxLength={2000}
      />

      {/* Toolbar Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] mt-2">
        {/* Left Actions */}
        <div className="flex items-center gap-1.5">
          {/* Plus / Upload Button (Direct System Picker) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 theme-dark:hover:bg-white/5 rounded-full transition-colors"
            title="Upload Project Files"
          >
            <Plus className="w-4 h-4" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
            accept=".zip,.html,.css,.js,.jsx,.json,.txt,.md"
          />

          {/* Mic Button (Functional Voice Typing) */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2 rounded-full transition-colors relative flex items-center justify-center ${
              isListening
                ? 'bg-rose-500/10 text-rose-500 animate-pulse border border-rose-500/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 theme-dark:hover:bg-white/5'
            }`}
            title={isListening ? 'Stop Voice Typing' : 'Start Voice Typing'}
          >
            {isListening ? <MicOff className="w-4 h-4 text-rose-500 animate-bounce" /> : <Mic className="w-4 h-4" />}
          </button>

          <div className="w-px h-4 bg-black/5 theme-dark:bg-white/10 mx-2" />

          {/* Stack Toggle (Vanilla vs React) */}
          <button
            type="button"
            onClick={() => setActiveStack(activeStack === 'vanilla' ? 'react-tailwind' : 'vanilla')}
            className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-400 theme-dark:text-indigo-400 theme-dark:hover:text-indigo-300 px-2.5 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
          >
            Stack: {activeStack === 'vanilla' ? 'Vanilla' : 'React'}
          </button>
        </div>

        {/* Right Actions: Send */}
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            {promptText.length}/2000
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasContent || isGenerating}
            className={`p-2.5 rounded-full transition-all duration-300 ${
              hasContent
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-100 hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-black/5 theme-dark:bg-white/5 border border-black/5 theme-dark:border-white/5 text-[var(--text-muted)] cursor-not-allowed'
            }`}
            aria-label="Send Message"
          >
            <ArrowUp className="w-4 h-4 stroke-[3px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PromptInput;
