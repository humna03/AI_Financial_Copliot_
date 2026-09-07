import { apiClient } from './client';
import type { Score } from '../types/score.types';

interface DataEnvelope<T> {
  data: T;
}

/** GET /api/users/{user_id}/score */
export async function getScore(userId: number): Promise<Score> {
  const res = await apiClient.get<DataEnvelope<Score>>(`/api/users/${userId}/score`);
  return res.data.data;
}
