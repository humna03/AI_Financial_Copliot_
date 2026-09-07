import { apiClient } from './client';
import type { SimulateInput, SimulateResult } from '../types/simulator.types';

interface DataEnvelope<T> {
  data: T;
}

/** POST /api/users/{user_id}/simulate — nothing is persisted by this call. */
export async function runSimulation(
  userId: number,
  payload: SimulateInput
): Promise<SimulateResult> {
  const res = await apiClient.post<DataEnvelope<SimulateResult>>(
    `/api/users/${userId}/simulate`,
    payload
  );
  return res.data.data;
}
