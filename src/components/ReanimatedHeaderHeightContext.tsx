import React, { createContext, useContext, ReactNode } from 'react';
import { useSharedValue } from 'react-native-reanimated';

interface ReanimatedHeaderHeightContextType {
  headerHeight: ReturnType<typeof useSharedValue<number>>;
}

const ReanimatedHeaderHeightContext = createContext<ReanimatedHeaderHeightContextType | undefined>(undefined);

export const useReanimatedHeaderHeight = () => {
  const context = useContext(ReanimatedHeaderHeightContext);
  if (!context) {
    throw new Error('useReanimatedHeaderHeight must be used within a ReanimatedHeaderHeightProvider');
  }
  return context;
};

interface ReanimatedHeaderHeightProviderProps {
  children: ReactNode;
}

export const ReanimatedHeaderHeightProvider: React.FC<ReanimatedHeaderHeightProviderProps> = ({ children }) => {
  const headerHeight = useSharedValue(0);

  return (
    <ReanimatedHeaderHeightContext.Provider value={{ headerHeight }}>
      {children}
    </ReanimatedHeaderHeightContext.Provider>
  );
};


