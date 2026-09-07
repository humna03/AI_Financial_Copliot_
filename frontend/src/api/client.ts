import axios, { AxiosError } from 'axios';
import { ApiError, type ApiErrorBody } from '../types/api.types';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function localizedApiMessage(message: string, code: string): string {
  if (localStorage.getItem('afc_language') !== 'ur') return message;
  if (code === 'NETWORK_ERROR') return 'سرور سے رابطہ نہیں ہو سکا۔ اپنا انٹرنیٹ کنکشن چیک کریں۔';
  if (code === 'UNAUTHORIZED') return 'آپ کا سیشن ختم ہو گیا ہے۔ براہ کرم دوبارہ لاگ ان کریں۔';
  if (code === 'FORBIDDEN') return 'آپ کو اس معلومات تک رسائی کی اجازت نہیں ہے۔';
  if (code === 'NOT_FOUND') return 'درخواست کردہ معلومات نہیں مل سکیں۔';
  if (code === 'VALIDATION_ERROR') return 'درج کی گئی معلومات درست نہیں ہیں۔ براہ کرم دوبارہ چیک کریں۔';
  return 'درخواست مکمل نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔';
}

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach the JWT (from /auth/login) to every request, if present.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('afc_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize every failure into an ApiError with the backend's { error: { code, message } } shape.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response) {
      const body = error.response.data;
      const code = body?.error?.code ?? 'UNKNOWN_ERROR';
      const message = body?.error?.message ?? error.message ?? 'Something went wrong.';

      if (error.response.status === 401) {
        localStorage.removeItem('afc_access_token');
        localStorage.removeItem('afc_auth_user');
        window.dispatchEvent(new CustomEvent('afc:unauthorized'));
      }

      return Promise.reject(new ApiError(localizedApiMessage(message, code), code, error.response.status));
    }

    if (error.request) {
      return Promise.reject(
        new ApiError(localizedApiMessage(
          'Could not reach the server. Check your connection and that the backend is running.',
          'NETWORK_ERROR',
        ), 'NETWORK_ERROR', 0)
      );
    }

    return Promise.reject(new ApiError(error.message, 'UNKNOWN_ERROR', 0));
  }
);
