import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

interface DynamicStatusBarProps {
  backgroundColor?: string;
  translucent?: boolean;
}

const DynamicStatusBar: React.FC<DynamicStatusBarProps> = ({ 
  backgroundColor = 'transparent',
  translucent = true 
}) => {
  const colorScheme = useColorScheme();
  
  // Determine status bar style based on color scheme
  const barStyle = colorScheme === 'dark' ? 'light' : 'dark';
  
  return (
    <StatusBar 
      style={barStyle}
      backgroundColor={backgroundColor}
      translucent={translucent}
    />
  );
};

export default DynamicStatusBar; 