// Generic backend response shape — matches { success, message, data? }
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}
