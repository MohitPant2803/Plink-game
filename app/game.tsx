import React from 'react';
import { View, StyleSheet, Text, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { GameBoard } from '../game/GameBoard';
import { useGameLoop } from '../hooks/useGameLoop';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

export default function GameScreen() {
  const { stack, score, gameOver, gameWon, handleTap, slicedPieces } = useGameLoop();
  const insets = useSafeAreaInsets();

  return (
    <Background score={score}>
      <StatusBar barStyle="dark-content" />
      
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.score}>{score}</Text>
          </View>
          
          <GameBoard
            stack={stack}
            score={score}
            gameOver={gameOver}
            gameWon={gameWon}
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
    top: Spacing.xl,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  score: {
    fontSize: Typography.size.mega,
    fontWeight: Typography.weight.light,
    color: Colors.text.primary,
    opacity: 0.3,
    letterSpacing: -2,
  },
});