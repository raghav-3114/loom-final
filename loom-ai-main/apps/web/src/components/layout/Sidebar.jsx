/**
 * @file Sidebar.jsx
 * @description Collapsible left navigation sidebar containing LOOM logo, New Chat, recent chats, projects, settings trigger, and collapse toggle.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, MessageSquare, Search, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import LoomLogo from '../ui/LoomLogo';
import SidebarItem from '../ui/SidebarItem';
import { useUI } from '../../contexts/UIContext';
import { useChat } from '../../contexts/ChatContext';

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, setIsSettingsModalOpen, showToast } = useUI();
  const { startNewChat, loadConversation, activeProjectId, conversationVersion } = useChat();
  const [conversations, setConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const refreshConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations');
      const body = await response.json();
      if (response.ok && body.success) setConversations(body.conversations);
    } catch (error) {
      console.error('[Sidebar] Failed to load saved conversations:', error);
    }
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations, conversationVersion]);

  const handleNewChat = async () => {
    try {
      await startNewChat();
    } catch (error) {
      console.error('[Sidebar] Failed to create new chat:', error);
    }
  };

  const handleConversationClick = async (projectId) => {
    try {
      await loadConversation(projectId);
    } catch (error) {
      console.error('[Sidebar] Failed to restore conversation:', error);
    }
  };

  const handleRenameConversation = async (projectId, newName) => {
    try {
      const response = await fetch(`/api/conversations/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      const body = await response.json();
      if (response.ok && body.success) {
        showToast('Chat renamed successfully', 'success');
        refreshConversations();
      } else {
        showToast(body.error || 'Failed to rename chat', 'warning');
      }
    } catch (error) {
      console.error('[Sidebar] Failed to rename conversation:', error);
      showToast('Failed to rename chat', 'warning');
    }
  };

  const handleDeleteConversation = async (projectId) => {
    try {
      const response = await fetch(`/api/conversations/${projectId}`, {
        method: 'DELETE',
      });
      const body = await response.json();
      if (response.ok && body.success) {
        showToast('Chat deleted successfully', 'success');
        refreshConversations();
        if (projectId === activeProjectId) {
          await startNewChat();
        }
      } else {
        showToast(body.error || 'Failed to delete chat', 'warning');
      }
    } catch (error) {
      console.error('[Sidebar] Failed to delete conversation:', error);
      showToast('Failed to delete chat', 'warning');
    }
  };

  const groupedConversations = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const filtered = conversations.filter((conversation) => (
      `${conversation.name} ${conversation.last_message || ''}`.toLowerCase().includes(searchTerm.trim().toLowerCase())
    ));

    return filtered.reduce((groups, conversation) => {
      const updatedAt = new Date(`${conversation.updated_at}Z`);
      const label = updatedAt >= startOfToday ? 'Today'
        : updatedAt >= startOfYesterday ? 'Yesterday'
          : updatedAt >= startOfWeek ? 'Last Week' : 'Earlier';
      groups[label] = [...(groups[label] || []), conversation];
      return groups;
    }, {});
  }, [conversations, searchTerm]);

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 w-64 sidebar-shell flex flex-col justify-between transition-transform duration-300 ease-in-out backdrop-blur-2xl z-20 border-r border-[var(--border-subtle)] ${
        sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
      }`}
    >
      {/* Top Header & Logo */}
      <div>
        <div className={`p-4 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && <LoomLogo size="md" />}
          <button
            onClick={toggleSidebar}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 theme-dark:hover:bg-white/5 rounded-xl transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* New Chat CTA */}
        <div className="px-3 py-2">
          <button
            onClick={handleNewChat}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-black/5 hover:bg-black/15 theme-dark:bg-white/5 theme-dark:hover:bg-white/15 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-black/5 theme-dark:border-white/5 hover:border-black/10 theme-dark:hover:border-white/10 transition-all font-display font-medium text-xs shadow-sm ${
              sidebarCollapsed ? 'px-2' : ''
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Navigation Sections */}
        {!sidebarCollapsed && (
          <div className="px-3 py-3 space-y-4 overflow-y-auto max-h-[calc(100vh-220px)] custom-scrollbar">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-black/5 theme-dark:border-white/5 bg-black/[0.02] theme-dark:bg-white/[0.03] text-[var(--text-muted)] hover:bg-black/[0.08] theme-dark:hover:bg-white/[0.08] hover:border-black/10 theme-dark:hover:border-white/10 transition-all focus-within:border-indigo-500/50">
              <Search className="w-3.5 h-3.5" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search projects"
                className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
              />
            </label>

            {Object.entries(groupedConversations).map(([group, items]) => (
              <div className="space-y-1" key={group}>
                <div className="px-3 text-[10px] font-display font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  {group}
                </div>
                {items.map((conversation) => (
                  <SidebarItem
                    key={conversation.id}
                    icon={MessageSquare}
                    label={conversation.name}
                    badge={conversation.status === 'building' ? 'Building' : conversation.status === 'error' ? 'Error' : undefined}
                    isActive={conversation.id === activeProjectId}
                    onClick={() => handleConversationClick(conversation.id)}
                    onRename={(newName) => handleRenameConversation(conversation.id, newName)}
                    onDelete={() => handleDeleteConversation(conversation.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Settings */}
      <div className="p-3 border-t border-white/5">
        <SidebarItem
          icon={Settings}
          label="Settings"
          collapsed={sidebarCollapsed}
          onClick={() => setIsSettingsModalOpen(true)}
        />
      </div>
    </aside>
  );
}

export default Sidebar;
