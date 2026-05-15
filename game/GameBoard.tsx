import React from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, runOnJS, useSharedValue, FadeInDown, FadeIn, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { MovingBlock } from './MovingBlock';
import { GameConfig } from '../constants/game';
import { Colors } from '../theme/colors';
import { cameraSpring, pulseSpring } from '../utils/animations';
import { BlockData, SlicedPieceData } from '../hooks/useGameLoop';

interface Props {
  stack: BlockData[];
  score: number;
  gameOver: boolean;
  gameWon: boolean;
  onTap: (x: number) => void;
  slicedPieces: SlicedPieceData[];
}

// Renders a soft, satisfying outward pulse when a block is perfectly placed
const PerfectGlow = ({ width, xOffset, bottom, colorIndex }: { width: number, xOffset: number, bottom: number, colorIndex: number }) => {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - progress.value),
    transform: [
      { translateX: xOffset },
      { scaleX: 1 + progress.value * 0.15 },
      { scaleY: 1 + progress.value * 0.8 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.placedBlock,
        {
          width,
          bottom,
          backgroundColor: Colors.blocks[colorIndex],
          shadowOpacity: 0, // Remove shadow on glow layer
          borderTopWidth: 0,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
};

// Renders placed blocks with a tiny tactile compression squish upon landing
const PlacedBlock = ({ block, index, totalLength }: { block: BlockData, index: number, totalLength: number }) => {
  const scaleY = useSharedValue(0.9); // Start slightly compressed
  const scaleX = useSharedValue(1.02); // Start slightly bulged

  React.useEffect(() => {
    scaleY.value = withSpring(1, { damping: 12, stiffness: 200, mass: 1 });
    scaleX.value = withSpring(1, { damping: 12, stiffness: 200, mass: 1 });
  }, [scaleX, scaleY]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: block.xOffset },
      { scaleX: scaleX.value },
      { scaleY: scaleY.value }
    ]
  }));

  return (
    <Animated.View
      style={[
        styles.placedBlock,
        {
          width: block.width,
          bottom: index * GameConfig.BLOCK_HEIGHT,
          backgroundColor: Colors.blocks[block.colorIndex],
          zIndex: totalLength - index,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0)']}
        style={{ flex: 1, borderRadius: 20 }}
      />
    </Animated.View>
  );
};

const FallingBlock = ({ piece }: { piece: SlicedPieceData }) => {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    // Gravity acceleration simulation, organic rotation, and fade
    translateY.value = withTiming(800, { duration: 1500, easing: Easing.in(Easing.quad) });
    rotate.value = withTiming(piece.direction * 120, { duration: 1500, easing: Easing.out(Easing.ease) });
    opacity.value = withTiming(0, { duration: 1500, easing: Easing.in(Easing.quad) });
  }, [piece.direction, rotate, translateY, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: piece.xOffset },
      { translateY: translateY.value },
      { rotateZ: `${rotate.value}deg` }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.placedBlock,
        {
          width: piece.width,
          bottom: piece.yIndex * GameConfig.BLOCK_HEIGHT,
          backgroundColor: Colors.blocks[piece.colorIndex],
          zIndex: 999,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0)']}
        style={{ flex: 1, borderRadius: 20 }}
      />
    </Animated.View>
  );
};

export const GameBoard = ({ stack, score, gameOver, gameWon, onTap, slicedPieces }: Props) => {
  const activeBlock = stack[stack.length - 1];
  const translateX = useSharedValue(0);
  const boardScale = useSharedValue(1);
  
  // Camera moves down smoothly as stack grows
  const cameraStyle = useAnimatedStyle(() => {
    const targetY = Math.max(0, (stack.length - 5) * GameConfig.BLOCK_HEIGHT);
    return {
      transform: [
        { translateY: withSpring(targetY, cameraSpring) },
        { scale: boardScale.value }
      ],
    };
  });

  const tapGesture = Gesture.Tap().onStart(() => {
    boardScale.value = withSequence(
      withTiming(0.995, { duration: 40 }), // Ultra subtle dip
      withSpring(1, pulseSpring) // Soft return
    );
    runOnJS(onTap)(translateX.value);
  });

  const placedBlocks = gameOver ? stack : stack.slice(0, -1);

  return (
    <GestureDetector gesture={tapGesture}>
      <View style={styles.container}>
        <Animated.View style={[styles.camera, cameraStyle]}>
          {placedBlocks.map((block, index) => (
            <React.Fragment key={block.id}>
              {block.isPerfect && (
                <PerfectGlow
                  width={block.width}
                  xOffset={block.xOffset}
                  bottom={index * GameConfig.BLOCK_HEIGHT}
                  colorIndex={block.colorIndex}
                />
              )}
              <PlacedBlock block={block} index={index} totalLength={stack.length} />
            </React.Fragment>
          ))}

          {slicedPieces.map((piece) => (
            <FallingBlock key={piece.id} piece={piece} />
          ))}
          
          {/* The Active Moving Block */}
          {!gameOver && !gameWon && activeBlock && (
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
          <Animated.View entering={FadeIn.duration(1500)} style={styles.restartOverlay}>
            <Animated.View entering={FadeInDown.duration(1200).delay(300).springify()} style={styles.scoreContainer}>
              <Text style={styles.gameOverText}>Beautiful run</Text>
              <Text style={styles.scoreBoardText}>{score}</Text>
              <Text style={styles.tapToRestartText}>Tap to drift again</Text>
            </Animated.View>
          </Animated.View>
        )}

        {gameWon && (
          <Animated.View entering={FadeIn.duration(3000)} style={[styles.restartOverlay, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <Animated.View entering={FadeInDown.duration(2000).delay(1500).springify()} style={styles.scoreContainer}>
              <Text style={[styles.gameOverText, { color: 'rgba(255, 255, 255, 0.8)' }]}>A beautiful journey</Text>
              <Text style={[styles.scoreBoardText, { color: '#FFF', fontSize: 32, marginBottom: 40 }]}>Peace Found</Text>
              <Text style={[styles.tapToRestartText, { color: 'rgba(255, 255, 255, 0.5)' }]}>Tap to return to Earth</Text>
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', width: '100%' },
  camera: { width: '100%', alignItems: 'center', bottom: '20%' },
  placedBlock: {
    height: GameConfig.BLOCK_HEIGHT,
    borderRadius: 20,
    position: 'absolute',
    borderTopWidth: 1.5,
    borderColor: Colors.ui.highlight,
    shadowColor: Colors.ui.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  activeLayer: { position: 'absolute', width: '100%', left: 0, alignItems: 'center', zIndex: 9999 },
  restartOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(253, 251, 247, 0.85)', // A warm, misty atmospheric dim
    zIndex: 100,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  gameOverText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.text.secondary,
    marginBottom: 16,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  scoreBoardText: {
    fontSize: 84, // Huge, elegant numbers
    fontWeight: '200',
    color: Colors.text.primary,
    marginBottom: 32,
  },
  tapToRestartText: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.6,
  },
});
