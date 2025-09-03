import React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  WithSpringConfig,
} from 'react-native-reanimated';

interface StaggeredEntryContainerProps {
  children: React.ReactNode;
  startDelay?: number;
  delayIncrement?: number;
}

const springConfig: WithSpringConfig = {
  damping: 20,
  stiffness: 150,
  mass: 0.7,
};

const StaggeredEntryContainer: React.FC<StaggeredEntryContainerProps> = ({
  children,
  startDelay = 0,
  delayIncrement = 100,
}) => {
  // Convert children to array for consistent handling
  const childrenArray = React.Children.toArray(children);

  return (
    <View>
      {childrenArray.map((child, index) => {
        const AnimatedChild = () => {
          const opacity = useSharedValue(0);
          const translateY = useSharedValue(20);

          const animatedStyle = useAnimatedStyle(() => ({
            opacity: opacity.value,
            transform: [{ translateY: translateY.value }],
          }));

          React.useEffect(() => {
            const delay = startDelay + index * delayIncrement;
            opacity.value = withDelay(delay, withSpring(1, springConfig));
            translateY.value = withDelay(delay, withSpring(0, springConfig));
          }, []);

          return (
            <Animated.View style={animatedStyle}>
              {child}
            </Animated.View>
          );
        };

        return <AnimatedChild key={index} />;
      })}
    </View>
  );
};

export default StaggeredEntryContainer; 