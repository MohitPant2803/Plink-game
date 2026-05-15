import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withRepeat, cancelAnimation, withDelay, interpolate } from 'react-native-reanimated';
import { Colors } from '../theme/colors';

interface Props {
  children: React.ReactNode;
  score?: number;
}

const GradientLayer = ({ colors, index, progress }: { colors: string[], index: number, progress: Animated.SharedValue<number> }) => {
  const style = useAnimatedStyle(() => {
    // Clamp the progress so it stays in deep space instead of looping back to day
    const maxScore = (Colors.sky.length - 1) * 10;
    const clampedProgress = Math.min(Math.max(0, progress.value), maxScore);
    const step = Math.floor(clampedProgress / 10);
    const nextStep = Math.min(step + 1, Colors.sky.length - 1);
    const localProgress = (clampedProgress % 10) / 10;

    let opacity = 0;
    if (index === step) opacity = 1 - localProgress;
    else if (index === nextStep) opacity = localProgress;

    return { opacity };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, style]} pointerEvents="none">
      <LinearGradient colors={colors} style={StyleSheet.absoluteFillObject} start={{x: 0.2, y: 0}} end={{x: 0.8, y: 1}} />
    </Animated.View>
  );
};

const Cloud = ({ width, left, top, duration, delay, progress }: { width: number, left: string | number, top: string | number, duration: number, delay: number, progress: Animated.SharedValue<number> }) => {
  const floatX = useSharedValue(0);

  useEffect(() => {
    floatX.value = withDelay(delay, withRepeat(withTiming(40, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(floatX);
  }, [duration, delay]);

  const style = useAnimatedStyle(() => {
    // Clouds fade in, then slowly fade out as you enter the upper atmosphere
    const opacity = interpolate(progress.value, [0, 30, 50, 70], [0.6, 0.85, 0.85, 0], 'clamp');
    return { opacity, transform: [{ translateX: floatX.value }] };
  });

  return (
    <Animated.View style={[{ position: 'absolute', left, top }, style]} pointerEvents="none">
      <View style={{ width, height: width * 0.3, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: width }} />
      <View style={{ position: 'absolute', top: -width * 0.15, left: width * 0.15, width: width * 0.4, height: width * 0.4, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: width }} />
      <View style={{ position: 'absolute', top: -width * 0.1, right: width * 0.2, width: width * 0.35, height: width * 0.35, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: width }} />
    </Animated.View>
  );
};

const Bird = ({ left, top, duration, delay, progress }: { left: string | number, top: string | number, duration: number, delay: number, progress: Animated.SharedValue<number> }) => {
  const floatY = useSharedValue(0);
  const flap = useSharedValue(1);

  useEffect(() => {
    floatY.value = withDelay(delay, withRepeat(withTiming(-20, { duration: duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    flap.value = withDelay(delay, withRepeat(withTiming(0.2, { duration: 800, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => { cancelAnimation(floatY); cancelAnimation(flap); };
  }, [duration, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [10, 25], [0.4, 0], 'clamp'),
    transform: [{ translateY: floatY.value }],
  }));
  const flapStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: flap.value }] }));

  return (
    <Animated.View style={[{ position: 'absolute', left, top }, style]} pointerEvents="none">
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, flapStyle]}>
        <View style={{ width: 10, height: 2, backgroundColor: Colors.text.primary, borderRadius: 2, transform: [{ rotate: '20deg' }, { translateX: 1 }] }} />
        <View style={{ width: 10, height: 2, backgroundColor: Colors.text.primary, borderRadius: 2, transform: [{ rotate: '-20deg' }, { translateX: -1 }] }} />
      </Animated.View>
    </Animated.View>
  );
};

const DistantTrees = ({ progress }: { progress: Animated.SharedValue<number> }) => {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 15], [0.7, 0], 'clamp'),
    // Trees sink gracefully downward off-screen as the player ascends
    transform: [{ translateY: progress.value * 50 }]
  }));

  return (
    <Animated.View style={[{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 300 }, style]} pointerEvents="none">
      {/* Back layer (lighter) */}
      <View style={{ position: 'absolute', bottom: -50, left: '5%', width: 0, height: 0, borderLeftWidth: 80, borderRightWidth: 80, borderBottomWidth: 250, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(162, 228, 184, 0.3)' }} />
      <View style={{ position: 'absolute', bottom: -50, right: '15%', width: 0, height: 0, borderLeftWidth: 70, borderRightWidth: 70, borderBottomWidth: 220, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(162, 228, 184, 0.3)' }} />
      
      {/* Front layer (slightly darker) */}
      <View style={{ position: 'absolute', bottom: -20, left: '25%', width: 0, height: 0, borderLeftWidth: 100, borderRightWidth: 100, borderBottomWidth: 300, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(174, 198, 207, 0.4)' }} />
      <View style={{ position: 'absolute', bottom: -80, right: '-5%', width: 0, height: 0, borderLeftWidth: 90, borderRightWidth: 90, borderBottomWidth: 280, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(174, 198, 207, 0.5)' }} />
    </Animated.View>
  );
};

const Airplane = ({ top, duration, delay, progress, direction = 1 }: { top: string | number, duration: number, delay: number, progress: Animated.SharedValue<number>, direction?: number }) => {
  const floatX = useSharedValue(0);

  useEffect(() => {
    const distance = direction === 1 ? 800 : -800; // Move far enough to gracefully cross the screen
    floatX.value = withDelay(delay, withRepeat(withTiming(distance, { duration, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(floatX);
  }, [duration, delay, direction]);

  const style = useAnimatedStyle(() => {
    // Airplanes slowly fade into existence only at higher altitudes
    // They then fade away as you ascend into near-space
    const opacity = interpolate(progress.value, [15, 35, 60, 80], [0, 0.6, 0.6, 0], 'clamp');
    return {
      opacity,
      transform: [{ translateX: floatX.value }, { scaleX: direction }]
    };
  });

  return (
    <Animated.View style={[{ position: 'absolute', top, left: direction === 1 ? -50 : '110%' }, style]} pointerEvents="none">
      {/* Main body */}
      <View style={{ width: 24, height: 5, backgroundColor: Colors.text.primary, borderRadius: 3 }} />
      {/* Wings */}
      <View style={{ position: 'absolute', top: -7, left: 8, width: 5, height: 19, backgroundColor: Colors.text.primary, borderRadius: 2, transform: [{ skewX: '-20deg' }] }} />
      {/* Tail */}
      <View style={{ position: 'absolute', top: -5, left: 1, width: 3, height: 7, backgroundColor: Colors.text.primary, borderRadius: 1.5, transform: [{ skewX: '-20deg' }] }} />
    </Animated.View>
  );
};

const Stars = ({ progress }: { progress: Animated.SharedValue<number> }) => {
  // Generate random static positions so they don't jump around
  const stars = React.useMemo(() => [...Array(40)].map(() => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1,
    opacity: Math.random() * 0.6 + 0.2
  })), []);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [60, 80], [0, 1], 'clamp')
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, style]} pointerEvents="none">
      {stars.map((s, i) => (
        <View key={i} style={{ position: 'absolute', left: s.left, top: s.top, width: s.size, height: s.size, backgroundColor: '#FFF', borderRadius: s.size, opacity: s.opacity }} />
      ))}
    </Animated.View>
  );
};

const Moon = ({ progress }: { progress: Animated.SharedValue<number> }) => {
  const floatY = useSharedValue(0);
  
  useEffect(() => {
    floatY.value = withRepeat(withTiming(-10, { duration: 4000, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(floatY);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [60, 80, 100], [0, 0.8, 1], 'clamp'),
    transform: [
      { translateX: interpolate(progress.value, [80, 100], [0, -80], 'clamp') },
      { translateY: interpolate(progress.value, [60, 90, 100], [40, 0, -30], 'clamp') + floatY.value },
      { scale: interpolate(progress.value, [80, 100], [1, 3.5], 'clamp') }
    ]
  }));
  return <Animated.View style={[{ position: 'absolute', right: '20%', top: '15%', width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFDF5', shadowColor: '#FFFDF5', shadowOpacity: 1, shadowRadius: 40 }, style]} pointerEvents="none" />;
};

const Satellite = ({ top, duration, delay, progress, direction = 1 }: { top: string | number, duration: number, delay: number, progress: Animated.SharedValue<number>, direction?: number }) => {
  const floatX = useSharedValue(0);
  useEffect(() => {
    const distance = direction === 1 ? 800 : -800;
    floatX.value = withDelay(delay, withRepeat(withTiming(distance, { duration, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(floatX);
  }, [duration, delay, direction]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [70, 90], [0, 0.6], 'clamp'),
    transform: [{ translateX: floatX.value }, { scaleX: direction }]
  }));
  return <Animated.View style={[{ position: 'absolute', top, left: direction === 1 ? -50 : '110%', alignItems: 'center', justifyContent: 'center' }, style]} pointerEvents="none">
    <View style={{ width: 8, height: 6, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 1, marginBottom: 1 }} />
    <View style={{ width: 14, height: 4, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 2 }} />
    <View style={{ width: 8, height: 6, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 1, marginTop: 1 }} />
  </Animated.View>;
};

export const Background = ({ children, score = 0 }: Props) => {
  const progress = useSharedValue(0);
  const breath = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score, { duration: 2500, easing: Easing.inOut(Easing.ease) });
    return () => cancelAnimation(progress);
  }, [score, progress]);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    return () => cancelAnimation(breath);
  }, [breath]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1.05 },
      { translateX: (breath.value - 0.5) * 15 },
      { translateY: (breath.value - 0.5) * 10 }
    ]
  }));

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Animated.View style={[StyleSheet.absoluteFillObject, breathStyle]} pointerEvents="none">
        {Colors.sky.map((colors, index) => (
          <GradientLayer key={index} colors={colors} index={index} progress={progress} />
        ))}
      </Animated.View>
      
      {/* Earth Atmosphere Elements */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Stars progress={progress} />
        <Moon progress={progress} />

        <DistantTrees progress={progress} />
        
        <Cloud width={200} left="-10%" top="15%" duration={18000} delay={0} progress={progress} />
        <Cloud width={140} left="60%" top="30%" duration={22000} delay={1000} progress={progress} />
        <Cloud width={220} left="20%" top="55%" duration={25000} delay={2000} progress={progress} />

        <Bird left="30%" top="25%" duration={12000} delay={0} progress={progress} />
        <Bird left="35%" top="22%" duration={14000} delay={400} progress={progress} />
        <Bird left="65%" top="45%" duration={15000} delay={800} progress={progress} />
        
        <Airplane top="18%" duration={25000} delay={5000} progress={progress} direction={1} />
        <Airplane top="35%" duration={28000} delay={15000} progress={progress} direction={-1} />

        <Satellite top="20%" duration={35000} delay={8000} progress={progress} direction={1} />
        <Satellite top="45%" duration={40000} delay={18000} progress={progress} direction={-1} />
      </View>
      {children}
    </View>
  );
};
