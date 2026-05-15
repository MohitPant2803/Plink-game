import React, { useEffect } from 'react';
import { View, StyleSheet, Text, StatusBar, useWindowDimensions, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withDelay, withSequence, FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Background } from '../components/Background';
import { GameBoard } from '../game/GameBoard';
import { useGameLoop } from '../hooks/useGameLoop';
import { Colors } from '../theme/colors';
import { useResponsive } from '../utils/responsive';
import * as Haptics from 'expo-haptics';

// --- EMOTIONAL GAME OVER SCREEN ---
const EMOTIONAL_QUOTES = [
  "every fall teaches rhythm",
  "the journey continues",
  "silence remembers progress",
  "begin again",
  "the clouds will wait for you"
];

const GameOverScreen = ({ score, onRetry }: { score: number, onRetry: () => void }) => {
  const quote = EMOTIONAL_QUOTES[score % EMOTIONAL_QUOTES.length];

  return (
    <Animated.View entering={FadeIn.duration(1500)} style={StyleSheet.absoluteFillObject}>
      {/* Dark Cinematic Atmosphere overlay */}
      <LinearGradient colors={['rgba(5, 8, 15, 0.85)', 'rgba(20, 25, 40, 0.98)']} style={StyleSheet.absoluteFillObject} />
      
      {/* Distant Minimal Moon */}
      <View style={{ position: 'absolute', top: '15%', left: '50%', marginLeft: -40, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,253,245,0.05)', shadowColor: '#FFFDF5', shadowOpacity: 0.3, shadowRadius: 50 }} />
      
      <View style={styles.gameOverContainer}>
        
        {/* Main Score UI */}
        <Animated.View entering={FadeInDown.duration(1200).delay(300).springify()} style={{ alignItems: 'center', marginBottom: 60 }}>
          <Text style={styles.gameOverScore}>{score}</Text>
          <Text style={styles.gameOverLabel}>fragments collected</Text>
        </Animated.View>

        {/* Rotating Emotional Text */}
        <Animated.View entering={FadeIn.duration(2000).delay(800)}>
          <Text style={styles.emotionalQuote}>"{quote}"</Text>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInUp.duration(1200).delay(1000).springify()} style={styles.actionRow}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onRetry(); }} style={[styles.glassBtn, styles.glassBtnPrimary, { flex: 1 }]}>
            <Text style={[styles.glassBtnText, { color: '#050810', fontWeight: '500' }]}>CONTINUE</Text>
          </Pressable>
        </Animated.View>

      </View>
    </Animated.View>
  );
};

export default function GameScreen() {
  const router = useRouter();
  const { stack, score, gameOver, gameWon, cinematicDone, handleTap, slicedPieces } = useGameLoop();
  const insets = useSafeAreaInsets();
  const { spacing } = useResponsive();
  const backgroundProgress = useSharedValue(0);
  const scoreOpacity = useSharedValue(1);

  useEffect(() => {
    if (gameWon) {
      // Synchronize the celestial background ascent exactly with the new master climb timeline
      backgroundProgress.value = withSequence(
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.cubic) }),                   // Descends directly to 0 by t=3s
        withDelay(16000, withTiming(12, { duration: 4000, easing: Easing.linear })),             // Climbs to 12 by t=23s
        withDelay(15000, withTiming(28, { duration: 4000, easing: Easing.linear })),             // Climbs to 28 by t=42s
        withDelay(14000, withTiming(45, { duration: 4000, easing: Easing.linear })),             // Climbs to 45 by t=60s
        withDelay(19000, withTiming(62, { duration: 4000, easing: Easing.linear })),             // Climbs to 62 by t=83s
        withDelay(20500, withTiming(78, { duration: 4000, easing: Easing.linear })),             // Climbs to 78 by t=107.5s
        withDelay(19500, withTiming(92, { duration: 4000, easing: Easing.linear })),             // Climbs to 92 by t=131s
        withDelay(21000, withTiming(100, { duration: 3500, easing: Easing.linear })),            // Climbs to 100 by t=155.5s
        withDelay(29500, withTiming(110, { duration: 4000, easing: Easing.out(Easing.quad) })),  // Moon shrinks between 185s - 189s
        withTiming(1000, { duration: 544000, easing: Easing.linear })                            // Endless Deep Space Ascension
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
          {!gameOver && !gameWon && (
            <Animated.View style={[styles.header, { top: spacing.xl }, scoreStyle]} pointerEvents="none">
              <Text style={styles.score}>{score}</Text>
            </Animated.View>
          )}
          
          <GameBoard
            stack={stack}
            score={score}
            gameOver={gameOver}
            gameWon={gameWon}
            cinematicDone={cinematicDone}
            onTap={handleTap}
            slicedPieces={slicedPieces}
          />

          {/* Cinematic Game Over Overlay */}
          {gameOver && score < 100 && <GameOverScreen score={score} onRetry={handleTap as any} />}
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
    fontSize: 80,
    fontWeight: '100',
    color: '#FFFDF5',
    opacity: 0.4,
    letterSpacing: -4,
  },
  gameOverContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 30,
    paddingBottom: 80,
  },
  gameOverScore: {
    fontSize: 100,
    fontWeight: '100',
    color: '#FFFDF5',
    letterSpacing: -4,
    textShadowColor: 'rgba(255,255,255,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  gameOverLabel: {
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginTop: -10,
  },
  emotionalQuote: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '300',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 1.5,
  },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  glassBtn: {
    paddingVertical: 18,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  glassBtnPrimary: { backgroundColor: '#FFFDF5', borderColor: '#FFFDF5', shadowColor: '#FFFDF5', shadowOpacity: 0.4, shadowRadius: 15 },
  glassBtnText: {
    color: '#FFFDF5',
    fontSize: 12,
    letterSpacing: 3,
  },
});