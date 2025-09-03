import React, { createContext, useContext, ReactNode } from 'react';
import { useSharedValue } from 'react-native-reanimated';

interface AnimatedHeaderHeightContextType {
  headerHeight: ReturnType<typeof useSharedValue<number>>;
}

const AnimatedHeaderHeightContext = createContext<AnimatedHeaderHeightContextType | undefined>(undefined);

export const useAnimatedHeaderHeight = () => {
  const context = useContext(AnimatedHeaderHeightContext);
  if (!context) {
    throw new Error('useAnimatedHeaderHeight must be used within an AnimatedHeaderHeightProvider');
  }
  return context;
};

interface AnimatedHeaderHeightProviderProps {
  children: ReactNode;
}

export const AnimatedHeaderHeightProvider: React.FC<AnimatedHeaderHeightProviderProps> = ({ children }) => {
  const headerHeight = useSharedValue(0);

  return (
    <AnimatedHeaderHeightContext.Provider value={{ headerHeight }}>
      {children}
    </AnimatedHeaderHeightContext.Provider>
  );
};

export default AnimatedHeaderHeightProvider;


