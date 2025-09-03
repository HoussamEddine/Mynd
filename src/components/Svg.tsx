import React from 'react';
import { ViewStyle } from 'react-native';
import Svg, { SvgProps as RNSvgProps } from 'react-native-svg';

export interface SvgProps extends RNSvgProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const SvgComponent: React.FC<SvgProps> = ({ 
  style, 
  children, 
  ...props 
}) => {
  return (
    <Svg style={style} {...props}>
      {children}
    </Svg>
  );
};

export default SvgComponent;


