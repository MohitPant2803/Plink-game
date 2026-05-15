import React from 'react';
import { View, StyleSheet, Text, StatusBar } from 'react-native';
import { Background } from '../components/Background';
import { GameBoard } from '../game/GameBoard';
import { useGameLoop } from '../hooks/useGameLoop';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

export default function GameScreen() {
  const { stack, score, gameOver, handleTap, restart } = useGameLoop();

  return (
    <Background>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.score}>{score}</Text>
      </View>
      
      <GameBoard
        stack={stack}
        gameOver={gameOver}
        onTap={handleTap}
        onRestart={restart}
      />
    </Background>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: Spacing.xxxl + Spacing.md,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  score: {
    fontSize: Typography.size.mega,
    fontWeight: Typography.weight.light,
    color: Colors.text.primary,
    opacity: 0.8,
  },
});