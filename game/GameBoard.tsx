import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, runOnJS, useSharedValue } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { MovingBlock } from './MovingBlock';
import { GameConfig } from '../constants/game';
import { Colors } from '../theme/colors';
import { premiumSpring } from '../utils/animations';
import { BlockData } from '../hooks/useGameLoop';

interface Props {
  stack: BlockData[];
  gameOver: boolean;
  onTap: (x: number) => void;
  onRestart: () => void;
}

export const GameBoard = ({ stack, gameOver, onTap, onRestart }: Props) => {
  const activeBlock = stack[stack.length - 1];
  const translateX = useSharedValue(0);
  
  // Camera moves down smoothly as stack grows
  const cameraStyle = useAnimatedStyle(() => {
    const targetY = Math.max(0, (stack.length - 5) * GameConfig.BLOCK_HEIGHT);
    return {
      transform: [{ translateY: withSpring(targetY, premiumSpring) }],
    };
  });

  const tapGesture = Gesture.Tap().onStart(() => {
    if (gameOver) return;
    runOnJS(onTap)(translateX.value);
  });

  const placedBlocks = gameOver ? stack : stack.slice(0, -1);

  return (
    <GestureDetector gesture={tapGesture}>
      <View style={styles.container}>
        <Animated.View style={[styles.camera, cameraStyle]}>
          {placedBlocks.map((block, index) => (
            <View
              key={block.id}
              style={[
                styles.placedBlock,
                {
                  width: block.width,
                  transform: [{ translateX: block.xOffset }],
                  bottom: index * GameConfig.BLOCK_HEIGHT,
                  backgroundColor: Colors.blocks[block.colorIndex],
                  zIndex: stack.length - index,
                },
              ]}
            />
          ))}
          
          {/* The Active Moving Block */}
          {!gameOver && activeBlock && (
            <View style={[styles.activeLayer, { bottom: (stack.length - 1) * GameConfig.BLOCK_HEIGHT }]}>
              <MovingBlock
                key={activeBlock.id}
                width={activeBlock.width}
                colorIndex={activeBlock.colorIndex}
                speed={GameConfig.INITIAL_SPEED * Math.pow(GameConfig.SPEED_MULTIPLIER, stack.length)}
                direction={stack.length % 2 === 0 ? 1 : -1}
                translateX={translateX}
                gameOver={gameOver}
              />
            </View>
          )}
        </Animated.View>

        {gameOver && (
          <Pressable style={styles.restartOverlay} onPress={onRestart}>
            <Text style={styles.restartText}>Tap to Restart</Text>
          </Pressable>
        )}
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  camera: { width: '100%', alignItems: 'center', bottom: '20%' },
  placedBlock: {
    height: GameConfig.BLOCK_HEIGHT,
    borderRadius: 20,
    position: 'absolute',
    shadowColor: Colors.ui.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  activeLayer: { position: 'absolute', width: '100%', alignItems: 'center' },
  restartOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    zIndex: 100,
  },
  restartText: {
    fontSize: 24,
    color: Colors.text.primary,
    fontWeight: '300',
    letterSpacing: 2,
  },
});
