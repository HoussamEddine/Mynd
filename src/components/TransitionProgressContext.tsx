import React, { createContext, useContext, ReactNode } from 'react';

interface TransitionProgressContextType {
  progress: number;
  setProgress: (progress: number) => void;
}

const TransitionProgressContext = createContext<TransitionProgressContextType | undefined>(undefined);

export const useTransitionProgress = () => {
  const context = useContext(TransitionProgressContext);
  if (!context) {
    throw new Error('useTransitionProgress must be used within a TransitionProgressProvider');
  }
  return context;
};

interface TransitionProgressProviderProps {
  children: ReactNode;
}

export const TransitionProgressProvider: React.FC<TransitionProgressProviderProps> = ({ children }) => {
  const [progress, setProgress] = React.useState(0);

  return (
    <TransitionProgressContext.Provider value={{ progress, setProgress }}>
      {children}
    </TransitionProgressContext.Provider>
  );
};

export default TransitionProgressProvider;


