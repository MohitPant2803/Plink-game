import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
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

  useEffect(() => {
    translateX.value = direction * -GameConfig.MAX_OSCILLATION;
    if (!gameOver) {
      translateX.value = withRepeat(
        withTiming(direction * GameConfig.MAX_OSCILLATION, {
          duration: speed,
          easing: Easing.inOut(Easing.sin), // Smooth easing, not harsh linear
        }),
        -1,
        true // Reverse direction automatically
      );
    } else {
      cancelAnimation(translateX);
    }
  }, [gameOver, speed, direction, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width,
  }));

  return (
    <Animated.View
      style={[
        styles.block,
        { backgroundColor: Colors.blocks[colorIndex] },
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  block: {
    height: GameConfig.BLOCK_HEIGHT,
    borderRadius: 20, // Premium rounded geometry
    position: 'absolute',
    shadowColor: Colors.ui.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
});
