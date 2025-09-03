import React from 'react';
import { LayoutAnimation, LayoutAnimationConfig as RNLayoutAnimationConfig, Platform } from 'react-native';

export interface LayoutAnimationConfig {
  duration: number;
  create?: RNLayoutAnimationConfig;
  update?: RNLayoutAnimationConfig;
  delete?: RNLayoutAnimationConfig;
}

export const useLayoutAnimation = () => {
  const animateLayout = React.useCallback((config?: Partial<LayoutAnimationConfig>) => {
    const defaultConfig: LayoutAnimationConfig = {
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    };

    const finalConfig = { ...defaultConfig, ...config };

    if (Platform.OS === 'ios') {
      LayoutAnimation.configureNext(finalConfig);
    } else {
      // Android fallback
      LayoutAnimation.configureNext({
        duration: finalConfig.duration,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
        },
        delete: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
      });
    }
  }, []);

  const animateSpring = React.useCallback((config?: Partial<LayoutAnimationConfig>) => {
    const springConfig: LayoutAnimationConfig = {
      duration: 500,
      create: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.7,
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.7,
      },
      delete: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.7,
      },
      ...config,
    };

    if (Platform.OS === 'ios') {
      LayoutAnimation.configureNext(springConfig);
    } else {
      // Android fallback
      LayoutAnimation.configureNext({
        duration: springConfig.duration,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
        },
        delete: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
      });
    }
  }, []);

  const animateLinear = React.useCallback((config?: Partial<LayoutAnimationConfig>) => {
    const linearConfig: LayoutAnimationConfig = {
      duration: 200,
      create: {
        type: LayoutAnimation.Types.linear,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.linear,
      },
      delete: {
        type: LayoutAnimation.Types.linear,
        property: LayoutAnimation.Properties.opacity,
      },
      ...config,
    };

    if (Platform.OS === 'ios') {
      LayoutAnimation.configureNext(linearConfig);
    } else {
      // Android fallback
      LayoutAnimation.configureNext({
        duration: linearConfig.duration,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
        },
        delete: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
      });
    }
  }, []);

  return {
    animateLayout,
    animateSpring,
    animateLinear,
  };
};

export const LayoutAnimationConfig: React.FC = () => {
  // This component is primarily for configuration, not rendering
  return null;
};

export default LayoutAnimationConfig;


