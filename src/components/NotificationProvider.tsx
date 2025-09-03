import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { NotificationBanner, NotificationType } from './NotificationBanner';
import { View, Text } from 'react-native';

interface NotificationContextValue {
  showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationItem {
  id: number;
  message: string;
  type: NotificationType;
}

const MAX_VISIBLE = 3;
const BANNER_HEIGHT = 72;
const GAP = 12;
const TOP_OFFSET = 24;

let notificationId = 0;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<NotificationItem[]>([]);

  const showNotification = useCallback((msg: string, notifType: NotificationType = 'info') => {
    notificationId += 1;
    setQueue(prev => [...prev, { id: notificationId, message: msg, type: notifType }]);
  }, []);

  const handleHide = useCallback((id: number) => {
    setQueue(prev => prev.filter(n => n.id !== id));
  }, []);

  // Removed test notifications

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {queue.slice(0, 3).map((notif, idx) => (
        <NotificationBanner
          key={notif.id}
          message={notif.message}
          type={notif.type}
          visible={true}
          onHide={() => handleHide(notif.id)}
          top={60 + idx * (40 + 4)}
        />
      ))}
    </NotificationContext.Provider>
  );
};

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within a NotificationProvider');
  return ctx;
} 