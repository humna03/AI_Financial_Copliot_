import { apiClient } from './client';
import type { FinancialData, FinancialDataInput, Goal, GoalInput } from '../types/financial.types';

interface DataEnvelope<T> {
  data: T;
}

/** GET /api/users/{user_id}/financial-data */
export async function getFinancialData(userId: number): Promise<FinancialData> {
  const res = await apiClient.get<DataEnvelope<FinancialData>>(
    `/api/users/${userId}/financial-data`
  );
  return res.data.data;
}

/** POST /api/users/{user_id}/financial-data — upsert (create or fully replace). */
export async function upsertFinancialData(
  userId: number,
  payload: FinancialDataInput
): Promise<FinancialData> {
  const res = await apiClient.post<DataEnvelope<FinancialData>>(
    `/api/users/${userId}/financial-data`,
    payload
  );
  return res.data.data;
}

/** GET /api/users/{user_id}/goal */
export async function getGoal(userId: number): Promise<Goal> {
  const res = await apiClient.get<DataEnvelope<Goal>>(`/api/users/${userId}/goal`);
  return res.data.data;
}

/** POST /api/users/{user_id}/goal — upsert (create or fully replace). */
export async function upsertGoal(userId: number, payload: GoalInput): Promise<Goal> {
  const res = await apiClient.post<DataEnvelope<Goal>>(`/api/users/${userId}/goal`, payload);
  return res.data.data;
}
