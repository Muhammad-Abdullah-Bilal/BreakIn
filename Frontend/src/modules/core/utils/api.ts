import { ApiResponse } from '../types/common';

/**
 * Handles API response and transforms it into a standardized format
 * 
 * @param response Fetch API response object
 * @returns Standardized API response
 */
export async function handleApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    const data = await response.json();
    
    if (response.ok) {
      return {
        data,
        status: response.status,
      };
    } else {
      return {
        error: {
          message: data.message || 'An unknown error occurred',
          code: data.code || 'UNKNOWN_ERROR',
        },
        status: response.status,
      };
    }
  } catch (error) {
    return {
      error: {
        message: 'Failed to parse response',
        code: 'PARSE_ERROR',
      },
      status: response.status,
    };
  }
}

/**
 * Creates query string from an object of parameters
 * 
 * @param params Object containing query parameters
 * @returns URL query string (with leading ?)
 */
export function createQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(`${key}[]`, String(item)));
      } else if (typeof value === 'object') {
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Formats an error response into a user-friendly message
 * 
 * @param error Error object or string
 * @returns User-friendly error message
 */
export function formatErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unknown error occurred';
}
