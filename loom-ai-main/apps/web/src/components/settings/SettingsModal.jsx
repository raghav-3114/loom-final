/**
 * @file SettingsModal.jsx
 * @description Settings modal tabbed configuration view for theme, AI provider display (real config),
 * and About Loom information. The AI Providers tab reads live data from the backend provider-manager.
 */

import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Tabs from '../ui/Tabs';
import LoomLogo from '../ui/LoomLogo';
import { useUI } from '../../contexts/UIContext';
import { getSettings } from '../../lib/apiClient';

const AGENT_LABELS = {
  router: 'Router Agent',
  builder: 'Builder Agent',
  reviewer: 'Reviewer Agent',
};

const AGENT_DESCRIPTIONS = {
  router: 'Classifies intent (generate, edit, explain, debug, off_topic) and routes requests.',
  builder: 'Generates or modifies code files based on the active stack.',
  reviewer: 'Validates Builder output and triggers a single repair pass if needed.',
};

const PROVIDER_BADGE_COLORS = {
  groq: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  gemini: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  openrouter: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

export function SettingsModal() {
  const { isSettingsModalOpen, setIsSettingsModalOpen } = useUI();
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState(null);

  const tabs = [
    { id: 'general', label: 'General & Theme' },
    { id: 'ai', label: 'AI Providers & Models' },
    { id: 'about', label: 'About Loom AI' },
  ];

  // Fetch real config when AI tab is opened
  useEffect(() => {
    if (activeTab === 'ai' && isSettingsModalOpen && !config) {
      setConfigLoading(true);
      setConfigError(null);
      getSettings()
        .then((res) => setConfig(res.data))
        .catch((err) => setConfigError(err.message || 'Failed to load configuration'))
        .finally(() => setConfigLoading(false));
    }
  }, [activeTab, isSettingsModalOpen]);

  return (
    <Modal
      isOpen={isSettingsModalOpen}
      onClose={() => setIsSettingsModalOpen(false)}
      title="Settings"
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab 1: General */}
        {activeTab === 'general' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200">Theme Mode</div>
                <div className="text-slate-400">Deep Charcoal Dark Glassmorphism</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                Dark Only
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: AI Settings — real live config */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            {configLoading && (
              <div className="text-center py-8 text-slate-400 text-sm">
                <div className="inline-block w-4 h-4 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full animate-spin mr-2" />
                Loading configuration...
              </div>
            )}

            {configError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                ⚠ {configError}
              </div>
            )}

            {config && !configLoading && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 pb-1">
                  Live configuration — read directly from server <code className="text-indigo-400">provider-manager.js</code>
                </p>
                {['router', 'builder', 'reviewer'].map((role) => {
                  const agent = config[role];
                  const badgeClass = PROVIDER_BADGE_COLORS[agent.provider] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
                  return (
                    <div
                      key={role}
                      className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-100">{AGENT_LABELS[role]}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${badgeClass}`}>
                          {agent.providerLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono text-indigo-300">{agent.modelLabel}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{AGENT_DESCRIPTIONS[role]}</p>
                    </div>
                  );
                })}

                <div className="mt-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 leading-relaxed">
                  💡 To change providers or models, update <code className="font-mono">BUILDER_PROVIDER</code>, <code className="font-mono">ROUTER_PROVIDER</code>, and <code className="font-mono">REVIEWER_PROVIDER</code> in your <code className="font-mono">.env</code> file and restart the server.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: About Loom */}
        {activeTab === 'about' && (
          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <LoomLogo size="md" />
              <span className="text-slate-400">v1.0.0 (Hackathon MVP)</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Loom AI is a specialized frontend development assistant designed specifically for students and beginner developers. Supports generation, explanation, and debugging across <strong>Vanilla HTML/CSS/JS</strong> and <strong>React + Tailwind CSS</strong> stacks.
            </p>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 space-y-1">
              <div className="font-semibold text-slate-300 mb-2">Architecture</div>
              <div className="text-slate-500 space-y-1">
                <div>🔀 <span className="text-slate-400">Router</span> — intent classification</div>
                <div>🏗 <span className="text-slate-400">Builder</span> — code generation per stack</div>
                <div>🔍 <span className="text-slate-400">Reviewer</span> — quality validation, 1 retry</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:brightness-110 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default SettingsModal;
