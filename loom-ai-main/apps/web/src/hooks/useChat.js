/**
 * @file useChat.js
 * @description Custom React hook providing access to ChatContext state and AI conversation actions.
 */

import { useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext.jsx';

/**
 * Hook to consume ChatContext values.
 * @returns {object} Chat context state and prompt dispatch methods.
 */
export function useChat() {
  return useContext(ChatContext);
}

export default useChat;
