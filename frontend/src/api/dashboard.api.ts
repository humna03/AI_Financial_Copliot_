import { apiClient } from './client';
import type { Dashboard } from '../types/dashboard.types';

interface DataEnvelope<T> {
  data: T;
}

/** GET /api/users/{user_id}/dashboard */
export async function getDashboard(userId: number): Promise<Dashboard> {
  const res = await apiClient.get<DataEnvelope<Dashboard>>(`/api/users/${userId}/dashboard`);
  return res.data.data;
}
