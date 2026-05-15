import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Background } from '../components/Background';
import { Button } from '../components/Button';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

export default function HomeScreen() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // Controls the peaceful fade out of the Splash text
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Background>
      <StatusBar barStyle="dark-content" />

      {isReady && (
        <Animated.View entering={FadeIn.duration(1200)} style={styles.container}>
          <Animated.View entering={FadeInUp.duration(1000).springify()} style={styles.titleContainer}>
            <Text style={styles.title}>Plink</Text>
            <Text style={styles.subtitle}>A minimalist journey</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(1000).delay(300).springify()}>
            <Button title="Play Now" onPress={() => router.push('/game')} />
          </Animated.View>
        </Animated.View>
      )}

      {!isReady && (
        <Animated.View entering={FadeIn.duration(1000)} exiting={FadeOut.duration(1000)} style={[StyleSheet.absoluteFill, styles.splashContainer]}>
          <Text style={styles.title}>Plink</Text>
        </Animated.View>
      )}
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl * 2,
  },
  title: {
    fontSize: Typography.size.hero,
    fontWeight: Typography.weight.light,
    color: Colors.text.primary,
    letterSpacing: Typography.letterSpacing.widest,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.regular,
    color: Colors.text.secondary,
    letterSpacing: Typography.letterSpacing.wide,
  },
});
