import React from 'react';
import { View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface UseProps {
  href: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  style?: ViewStyle;
  animated?: boolean;
  animationDuration?: number;
}

export const Use: React.FC<UseProps> = ({
  href,
  x = 0,
  y = 0,
  width,
  height,
  style,
  animated = false,
  animationDuration = 300,
}) => {
  const useStyle: ViewStyle = {
    position: 'absolute',
    left: x,
    top: y,
    ...(width && { width }),
    ...(height && { height }),
    ...style,
  };

  return (
    <View style={useStyle} accessibilityLabel={`Used symbol ${href}`}>
      {/* In a real implementation, this would reference the actual symbol */}
      <View style={{ width: '100%', height: '100%', backgroundColor: theme.foundations.colors.primary + '20' }} />
    </View>
  );
};

export default Use;


