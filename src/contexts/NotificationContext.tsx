import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { NotificationBanner, NotificationType } from '../components/NotificationBanner';
import { errorHandlerService } from '../services/errorHandlerService';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  visible: boolean;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const showNotificationRef = useRef<(message: string, type?: NotificationType) => void>();
  const lastShownRef = useRef<Map<string, number>>(new Map());

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Date.now().toString();
    const newNotification: Notification = {
      id,
      message,
      type,
      visible: true,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-hide notification after 10 seconds
    setTimeout(() => {
      hideNotification(id);
    }, 10000);
  }, []);

  // Connect error handler service to notification system
  useEffect(() => {
    errorHandlerService.setNotificationCallback(showNotification);
  }, [showNotification]);

  // Store the function in a ref to avoid dependency issues
  showNotificationRef.current = showNotification;

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, visible: false }
          : notification
      ).filter(notification => notification.visible)
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Set up global error handling
  useEffect(() => {
    // Override console.error to show notifications
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      
      // Show error as notification if it's a string or Error object
      const errorMessage = args.find(arg => 
        typeof arg === 'string' || arg instanceof Error
      );
      
      if (errorMessage && showNotificationRef.current) {
        const message = (typeof errorMessage === 'string' 
          ? errorMessage 
          : (errorMessage as Error).message) || '';

        // Suppress noisy auth stack errors; UI surfaces a friendly message separately
        const suppressPatterns = [
          /^\[AUTH\]/i,
          /AuthApiError/i,
          /supabase\.auth/i,
          /Error initializing app/i,
          /Error determining app state/i,
          /Error determining onboarding step/i,
          /Error fetching user completion steps/i,
          /Error creating user completion steps/i,
          /Error updating completion step/i,
          /relation.*does not exist/i,
          /42P01/i,
        ];
        if (suppressPatterns.some(p => p.test(message))) {
          return;
        }

        // De-duplicate identical errors shown within a short window
        const now = Date.now();
        const last = lastShownRef.current.get(message) || 0;
        if (now - last < 2000) {
          return;
        }
        lastShownRef.current.set(message, now);

        showNotificationRef.current(message, 'error');
      }
    };

    // Cleanup function
    return () => {
      console.error = originalConsoleError;
    };
  }, []); // Remove showNotification from dependencies

  const value = {
    showNotification,
    hideNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {notifications.map((notification, index) => (
        <NotificationBanner
          key={`${notification.id}-${index}`} // Add index to make keys unique
          message={notification.message}
          type={notification.type}
          visible={notification.visible}
          onHide={() => hideNotification(notification.id)}
          top={60 + (index * 60)} // Stack notifications vertically
        />
      ))}
    </NotificationContext.Provider>
  );
} 