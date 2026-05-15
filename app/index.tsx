import React, { useEffect } from 'react';
import { View, StyleSheet, Text, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Background } from '../components/Background';
import { Button } from '../components/Button';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Breathing animation for the main title
  const breath = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [breath]);

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (breath.value - 0.5) * 12 }]
  }));

  return (
    <Background>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.container}>
          <Animated.View entering={FadeInUp.duration(1200).springify()} style={[styles.titleContainer, breathingStyle]}>
            <Text style={styles.title}>Plink</Text>
            <Text style={styles.subtitle}>A minimalist journey</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(1200).delay(400).springify()}>
            <Button title="Play Now" onPress={() => router.push('/game')} />
          </Animated.View>
        </View>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl * 2.5,
  },
  title: {
    fontSize: 72,
    fontWeight: '200',
    color: Colors.text.primary,
    letterSpacing: 12,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.text.secondary,
    letterSpacing: 6,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
});
