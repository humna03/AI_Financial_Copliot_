import { apiClient } from './client';
import type { CopilotAskResult, ConversationTurn } from '../types/copilot.types';

interface DataEnvelope<T> {
  data: T;
}

/** How many recent turns to send as context. Keeps the request payload and
 * prompt size bounded while still giving the AI (and the backend's
 * language detector) enough conversation to resolve references like
 * "is mein se" or "how can I invest this amount" back to what was
 * discussed a turn or two earlier. Must stay <= the backend's
 * CopilotAskRequest.history max_length. */
const MAX_HISTORY_TURNS = 10;

/** POST /api/users/{user_id}/copilot/ask — the backend assembles financial
 * context server-side; the frontend sends the question plus recent
 * conversation history so the AI has multi-turn context and so language
 * detection can use the previous turn as a fallback for short/ambiguous
 * follow-ups (e.g. "haan", "acha"). */
export async function askCopilot(
  userId: number,
  question: string,
  history: ConversationTurn[] = []
): Promise<CopilotAskResult> {
  const trimmedHistory = history.slice(-MAX_HISTORY_TURNS);
  const res = await apiClient.post<DataEnvelope<CopilotAskResult>>(
    `/api/users/${userId}/copilot/ask`,
    { question, history: trimmedHistory }
  );
  const data = res.data?.data;
  if (!data || typeof data.answer !== 'string' || !data.answer.trim()) {
    throw new Error('Copilot returned an empty or malformed response.');
  }
  return data;
}
