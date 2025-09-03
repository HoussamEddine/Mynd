import React, { createContext, useContext, ReactNode } from 'react';
import { useSharedValue } from 'react-native-reanimated';

interface ReanimatedScreenContextType {
  screenTransition: ReturnType<typeof useSharedValue<'in' | 'out'>>;
  screenOpacity: ReturnType<typeof useSharedValue<number>>;
  screenScale: ReturnType<typeof useSharedValue<number>>;
}

const ReanimatedScreenContext = createContext<ReanimatedScreenContextType | undefined>(undefined);

export const useReanimatedScreen = () => {
  const context = useContext(ReanimatedScreenContext);
  if (!context) {
    throw new Error('useReanimatedScreen must be used within a ReanimatedScreenProvider');
  }
  return context;
};

interface ReanimatedScreenProviderProps {
  children: ReactNode;
}

export const ReanimatedScreenProvider: React.FC<ReanimatedScreenProviderProps> = ({ children }) => {
  const screenTransition = useSharedValue<'in' | 'out'>('in');
  const screenOpacity = useSharedValue(1);
  const screenScale = useSharedValue(1);

  return (
    <ReanimatedScreenContext.Provider value={{ 
      screenTransition, 
      screenOpacity, 
      screenScale 
    }}>
      {children}
    </ReanimatedScreenContext.Provider>
  );
};


