export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

/** Normalized error thrown by the api client for every failed request. */
export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}
