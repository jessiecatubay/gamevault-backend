export type ApiResponse<T> = {
  data: T;
};

export type ApiErrorResponse = {
  error: {
    message: string;
    details?: unknown;
  };
};
