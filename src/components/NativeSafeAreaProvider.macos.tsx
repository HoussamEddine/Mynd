import React from 'react';
import { View, ViewStyle } from 'react-native';

interface NativeSafeAreaProviderMacOSProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const NativeSafeAreaProviderMacOS: React.FC<NativeSafeAreaProviderMacOSProps> = ({ 
  children, 
  style 
}) => {
  return (
    <View style={[{ flex: 1 }, style]}>
      {children}
    </View>
  );
};

export default NativeSafeAreaProviderMacOS;


