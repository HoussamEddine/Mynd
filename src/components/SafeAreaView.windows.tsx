import React from 'react';
import { View, ViewStyle } from 'react-native';

interface SafeAreaViewWindowsProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const SafeAreaViewWindows: React.FC<SafeAreaViewWindowsProps> = ({ 
  children, 
  style 
}) => {
  return (
    <View style={[{ flex: 1 }, style]}>
      {children}
    </View>
  );
};

export default SafeAreaViewWindows;


