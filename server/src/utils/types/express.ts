export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
  requestId?: string;
  path?: string;
  details?: any;
}

export interface PaginatedResponse<T> extends ApiResponse {
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ErrorResponse extends ApiResponse {
  success: false;
  error: string;
  details?: any;
}

// Helper function to get request ID from request object
export function getRequestId(req: any): string {
  return req.requestId || 'unknown';
} 