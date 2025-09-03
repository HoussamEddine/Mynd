import React, { createContext, useContext, ReactNode } from 'react';
import { useSharedValue } from 'react-native-reanimated';

interface ReanimatedTransitionProgressContextType {
  progress: ReturnType<typeof useSharedValue<number>>;
  closing: ReturnType<typeof useSharedValue<number>>;
  goingForward: ReturnType<typeof useSharedValue<number>>;
}

const ReanimatedTransitionProgressContext = createContext<ReanimatedTransitionProgressContextType | undefined>(undefined);

export const useReanimatedTransitionProgress = () => {
  const context = useContext(ReanimatedTransitionProgressContext);
  if (!context) {
    throw new Error('useReanimatedTransitionProgress must be used within a ReanimatedTransitionProgressProvider');
  }
  return context;
};

interface ReanimatedTransitionProgressProviderProps {
  children: ReactNode;
}

export const ReanimatedTransitionProgressProvider: React.FC<ReanimatedTransitionProgressProviderProps> = ({ children }) => {
  const progress = useSharedValue(0);
  const closing = useSharedValue(0);
  const goingForward = useSharedValue(0);

  return (
    <ReanimatedTransitionProgressContext.Provider value={{ 
      progress, 
      closing, 
      goingForward 
    }}>
      {children}
    </ReanimatedTransitionProgressContext.Provider>
  );
};


