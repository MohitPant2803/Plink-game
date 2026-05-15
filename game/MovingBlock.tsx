import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue,
  withRepeat, 
  withTiming, 
  Easing,
  withSpring,
  cancelAnimation
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { GameConfig } from '../constants/game';

interface Props {
  width: number;
  colorIndex: number;
  speed: number;
  direction: number;
  translateX: Animated.SharedValue<number>;
  gameOver: boolean;
}

export const MovingBlock = ({ width, colorIndex, speed, direction, translateX, gameOver }: Props) => {
  const { width: windowWidth } = useWindowDimensions();
  const screenWidth = Math.min(windowWidth, 500);
  const maxOscillation = 0; // TEMPORARILY DISABLED: Set to 0 so you can rapidly tap to test the cinematic ending!
  const floatY = useSharedValue(0);

  useEffect(() => {
    if (!gameOver) {
      translateX.value = direction * -maxOscillation;
      translateX.value = withRepeat(
        withTiming(direction * maxOscillation, {
          duration: speed,
          easing: Easing.inOut(Easing.sin), // Smooth easing, not harsh linear
        }),
        -1,
        true // Reverse direction automatically
      );

      // Subtle vertical floating motion for an airy, hovering feel
      floatY.value = withRepeat(
        withTiming(-4, { duration: speed * 0.85, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    } else {
      // Softly settle with inertia instead of rigidly snapping to a halt
      translateX.value = withSpring(translateX.value + (direction * 25), {
        damping: 25,
        stiffness: 60,
        mass: 1,
      });
      floatY.value = withSpring(0, { damping: 20, stiffness: 60 });
    }

    return () => {
      cancelAnimation(translateX);
      cancelAnimation(floatY);
    };
  }, [gameOver, speed, direction, translateX, maxOscillation, floatY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: floatY.value }],
    width,
  }));

  return (
    <Animated.View
      style={[
        styles.block,
        { backgroundColor: Colors.blocks[colorIndex] },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0)']}
        style={{ flex: 1, borderRadius: 20 }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  block: {
    height: GameConfig.BLOCK_HEIGHT,
    borderRadius: 20, // Premium rounded geometry
    position: 'absolute',
    bottom: 0,
    borderTopWidth: 1.5,
    borderColor: Colors.ui.highlight,
    shadowColor: Colors.ui.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
});
