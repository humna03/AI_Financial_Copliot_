import type { MessageLanguage } from '../utils/messageLanguage';

export interface CopilotAskResult {
  answer: string;
  /** Language actually detected from the user's message for this turn —
   * "en" | "roman-ur" | "ur" — NOT the account's stored UI language. */
  language: MessageLanguage;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  /** Detected/known language for this specific message, used to set its
   * text direction and font. Undefined until known (e.g. briefly for a
   * freshly-added user message before an optimistic client-side guess is
   * applied, or for messages predating this field). */
  language?: MessageLanguage;
}
