import React, { createContext, useContext, ReactNode } from 'react';

interface HeaderHeightContextType {
  headerHeight: number;
  setHeaderHeight: (height: number) => void;
}

const HeaderHeightContext = createContext<HeaderHeightContextType | undefined>(undefined);

export const useHeaderHeight = () => {
  const context = useContext(HeaderHeightContext);
  if (!context) {
    throw new Error('useHeaderHeight must be used within a HeaderHeightProvider');
  }
  return context;
};

interface HeaderHeightProviderProps {
  children: ReactNode;
}

export const HeaderHeightProvider: React.FC<HeaderHeightProviderProps> = ({ children }) => {
  const [headerHeight, setHeaderHeight] = React.useState(0);

  return (
    <HeaderHeightContext.Provider value={{ headerHeight, setHeaderHeight }}>
      {children}
    </HeaderHeightContext.Provider>
  );
};

export default HeaderHeightProvider;


