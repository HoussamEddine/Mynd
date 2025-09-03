import { Alert } from 'react-native';

// Function to show different types of notifications
export function showErrorNotification(showNotification: (message: string, type: any) => void, error: any) {
  let message = 'An error occurred';
  let type: 'error' | 'warning' | 'info' = 'error';

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error?.message) {
    message = error.message;
  } else if (error?.error) {
    message = error.error;
  }

  // Determine notification type based on error
  if (message.includes('network') || message.includes('connection')) {
    type = 'warning';
  } else if (message.includes('permission') || message.includes('access')) {
    type = 'info';
  }

  showNotification(message, type);
}

// Simple error handler for common error patterns
export function handleError(showNotification: (message: string, type: any) => void, error: any, context?: string) {
  console.error(`Error in ${context || 'app'}:`, error);
  showErrorNotification(showNotification, error);
} 