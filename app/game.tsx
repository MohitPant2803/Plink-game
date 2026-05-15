import React, { useEffect } from 'react';
import { View, StyleSheet, Text, StatusBar, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withDelay, withSequence } from 'react-native-reanimated';
import { Background } from '../components/Background';
import { GameBoard } from '../game/GameBoard';
import { useGameLoop } from '../hooks/useGameLoop';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { useResponsive } from '../utils/responsive';

export default function GameScreen() {
  const { stack, score, gameOver, gameWon, cinematicDone, handleTap, slicedPieces } = useGameLoop();
  const insets = useSafeAreaInsets();
  const { fontSize, spacing } = useResponsive();
  const backgroundProgress = useSharedValue(0);
  const scoreOpacity = useSharedValue(1);

  useEffect(() => {
    if (gameWon) {
      // Synchronize the celestial background ascent exactly with the new 108-second master climb timeline
      backgroundProgress.value = withSequence(
        withDelay(5500, withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.cubic) })), // Descends to 0 by t=13.5s
        withDelay(1500, withTiming(12, { duration: 5000, easing: Easing.linear })),             // Climbs to 12 by t=20s
        withDelay(9000, withTiming(28, { duration: 4000, easing: Easing.linear })),             // Climbs to 28 by t=33s
        withDelay(9000, withTiming(45, { duration: 4000, easing: Easing.linear })),             // Climbs to 45 by t=46s
        withDelay(9000, withTiming(62, { duration: 4000, easing: Easing.linear })),             // Climbs to 62 by t=59s
        withDelay(9000, withTiming(78, { duration: 4000, easing: Easing.linear })),             // Climbs to 78 by t=72s
        withDelay(9000, withTiming(92, { duration: 4000, easing: Easing.linear })),             // Climbs to 92 by t=85s
        withDelay(10000, withTiming(100, { duration: 5000, easing: Easing.out(Easing.quad) }))  // Ascends to moon by t=100s
      );
      scoreOpacity.value = withTiming(0, { duration: 2000 });
    } else {
      // During gameplay, progress the background with the score
      backgroundProgress.value = withTiming(score, { duration: 1500 });
      scoreOpacity.value = withTiming(1, { duration: 500 });
    }
  }, [score, gameWon]);

  const scoreStyle = useAnimatedStyle(() => ({ opacity: scoreOpacity.value }));

  return (
    <Background progress={backgroundProgress}>
      <StatusBar barStyle="dark-content" />
      
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.container}>
          <Animated.View style={[styles.header, { top: spacing.xl }, scoreStyle]} pointerEvents="none">
            <Text style={[styles.score, { fontSize: fontSize.mega }]}>{score}</Text>
          </Animated.View>
          
          <GameBoard
            stack={stack}
            score={score}
            gameOver={gameOver}
            gameWon={gameWon}
            cinematicDone={cinematicDone}
            onTap={handleTap}
            slicedPieces={slicedPieces}
          />
        </View>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, width: '100%', maxWidth: 500, alignSelf: 'center' },
  header: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  score: {
    fontWeight: '200',
    color: Colors.text.primary,
    opacity: 0.3,
    letterSpacing: -2,
  },
});