import React from 'react';
import { View, ViewStyle } from 'react-native';

interface NativeSafeAreaProviderWindowsProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const NativeSafeAreaProviderWindows: React.FC<NativeSafeAreaProviderWindowsProps> = ({ 
  children, 
  style 
}) => {
  return (
    <View style={[{ flex: 1 }, style]}>
      {children}
    </View>
  );
};

export default NativeSafeAreaProviderWindows;


