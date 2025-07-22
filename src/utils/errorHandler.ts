import { AxiosError } from 'axios';

// Interface para errores de API
interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  error?: string;
}

// Type guard para verificar si es un AxiosError
export const isAxiosError = (error: unknown): error is AxiosError<ApiErrorResponse> => {
  return error !== null && typeof error === 'object' && 'isAxiosError' in error;
};

// Helper para extraer mensaje de error
export const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Error desconocido';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Error desconocido';
};

// Helper para extraer datos de error para debug
export const getErrorData = (error: unknown): any => {
  if (isAxiosError(error)) {
    return error.response?.data;
  }
  
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }
  
  return error;
};