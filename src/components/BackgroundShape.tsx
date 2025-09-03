import React from 'react';
import { StyleSheet, Dimensions, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants'
const { colors } = theme.foundations;;

const { width: screenWidth } = Dimensions.get('window');

const BackgroundShape: React.FC = () => {
  return (
    <View style={styles.bottomShapeContainer}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.gradientFill}
        start={{ x: 0.4, y: 0.2 }}
        end={{ x: 1, y: 1 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomShapeContainer: {
    position: 'absolute',
    width: screenWidth * 1.5,
    height: 600,
    left: -(screenWidth * 0.25),
    top: -420,
    borderRadius: screenWidth ,
    overflow: 'hidden',
  },
  gradientFill: {
    width: '100%',
    height: '100%',
  },
});

export default BackgroundShape;