import { apiClient } from './client';
import type { FinancialUser, Language } from '../types/auth.types';

interface DataEnvelope<T> {
  data: T;
}

/** POST /api/users — creates the financial-profile identity (user_id) that every
 * financial-data/score/simulator/copilot/dashboard endpoint is scoped under. */
export async function createFinancialUser(language: Language): Promise<FinancialUser> {
  const res = await apiClient.post<DataEnvelope<FinancialUser>>('/api/users', { language });
  return res.data.data;
}
