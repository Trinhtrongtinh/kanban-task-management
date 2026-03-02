import { ApiResponse as IApiResponse } from '../interfaces';

/**
 * Utility class for creating standardized API responses
 * Use this when you want explicit control over the response structure
 */
export class ApiResponse {
  /**
   * Create a success response
   */
  static success<T>(
    data: T,
    message: string = 'Request successful',
    statusCode: number = 200,
  ): IApiResponse<T> {
    return {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if an object is already an ApiResponse
   */
  static isApiResponse(obj: unknown): obj is IApiResponse<unknown> {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    const response = obj as Record<string, unknown>;
    return (
      typeof response.success === 'boolean' &&
      typeof response.statusCode === 'number' &&
      typeof response.message === 'string' &&
      'data' in response &&
      typeof response.timestamp === 'string'
    );
  }
}
