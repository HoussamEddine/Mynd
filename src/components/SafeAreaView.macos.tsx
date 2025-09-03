import React from 'react';
import { View, ViewStyle } from 'react-native';

interface SafeAreaViewMacOSProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const SafeAreaViewMacOS: React.FC<SafeAreaViewMacOSProps> = ({ 
  children, 
  style 
}) => {
  return (
    <View style={[{ flex: 1 }, style]}>
      {children}
    </View>
  );
};

export default SafeAreaViewMacOS;


