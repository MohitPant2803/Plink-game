import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withRepeat, cancelAnimation, withDelay, interpolate, withSpring, useAnimatedReaction } from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { useResponsive } from '../utils/responsive';
import { GameConfig } from '../constants/game';
import { cameraSpring } from '../utils/animations';

interface Props {
  children: React.ReactNode;
  progress: Animated.SharedValue<number>;
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
  const { scale } = useResponsive();

  useEffect(() => {
    floatX.value = withDelay(delay, withRepeat(withTiming(50, { duration: duration * 2, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(floatX);
  }, [duration, delay]);

  const style = useAnimatedStyle(() => {
    // Clouds fade in, then slowly fade out as you enter the upper atmosphere
    const opacity = interpolate(progress.value, [0, 20, 40, 60], [0.5, 0.8, 0.8, 0], 'clamp');
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

const Bird = ({ top, duration, delay, progress, direction = 1 }: { top: string | number, duration: number, delay: number, progress: Animated.SharedValue<number>, direction?: number }) => {
  const floatY = useSharedValue(0);
  const floatX = useSharedValue(0);
  const flap = useSharedValue(1);

  useEffect(() => {
    floatY.value = withDelay(delay, withRepeat(withTiming(-20, { duration: 1500, easing: Easing.inOut(Easing.sin) }), -1, true));
    flap.value = withDelay(delay, withRepeat(withTiming(0.2, { duration: 800, easing: Easing.inOut(Easing.sin) }), -1, true));
    const distance = direction === 1 ? 3000 : -3000; // Guaranteed to cross any screen
    floatX.value = withDelay(delay, withRepeat(withTiming(distance, { duration, easing: Easing.linear }), -1, false));
    return () => { cancelAnimation(floatY); cancelAnimation(flap); cancelAnimation(floatX); };
  }, [duration, delay, direction]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 10, 25], [0.4, 0.4, 0], 'clamp'),
    transform: [{ translateX: floatX.value }, { translateY: floatY.value }, { scaleX: direction }],
  }));
  const flapStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: flap.value }] }));

  return (
    <Animated.View style={[{ position: 'absolute', top, left: direction === 1 ? -100 : '110%' }, style]} pointerEvents="none">
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, flapStyle]}>
        <View style={{ width: 10, height: 2, backgroundColor: Colors.text.primary, borderRadius: 2, transform: [{ rotate: '20deg' }, { translateX: 1 }] }} />
        <View style={{ width: 10, height: 2, backgroundColor: Colors.text.primary, borderRadius: 2, transform: [{ rotate: '-20deg' }, { translateX: -1 }] }} />
      </Animated.View>
    </Animated.View>
  );
};

const DistantTrees = ({ progress, panY }: { progress: Animated.SharedValue<number>, panY: Animated.SharedValue<number> }) => {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 15], [1, 0], 'clamp'),
    // Trees and ground sink correctly locked with the calculated panY value
    transform: [{ translateY: panY.value }]
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, style]} pointerEvents="none">
      {/* Back layer (lighter) */}
      <View style={{ position: 'absolute', bottom: '19%', left: '5%', width: 0, height: 0, borderLeftWidth: 80, borderRightWidth: 80, borderBottomWidth: 250, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(102, 140, 163, 0.4)' }} />
      <View style={{ position: 'absolute', bottom: '18%', right: '15%', width: 0, height: 0, borderLeftWidth: 70, borderRightWidth: 70, borderBottomWidth: 220, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(102, 140, 163, 0.4)' }} />
      <View style={{ position: 'absolute', bottom: '14%', left: '5%', width: 0, height: 0, borderLeftWidth: 80, borderRightWidth: 80, borderBottomWidth: 250, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(102, 140, 163, 0.4)' }} />
      <View style={{ position: 'absolute', bottom: '13%', right: '15%', width: 0, height: 0, borderLeftWidth: 70, borderRightWidth: 70, borderBottomWidth: 220, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(102, 140, 163, 0.4)' }} />
      
      {/* Front layer (slightly darker) */}
      <View style={{ position: 'absolute', bottom: '19%', left: '25%', width: 0, height: 0, borderLeftWidth: 100, borderRightWidth: 100, borderBottomWidth: 300, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(63, 100, 126, 0.6)' }} />
      <View style={{ position: 'absolute', bottom: '18%', right: '-5%', width: 0, height: 0, borderLeftWidth: 90, borderRightWidth: 90, borderBottomWidth: 280, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(63, 100, 126, 0.7)' }} />
      <View style={{ position: 'absolute', bottom: '14%', left: '25%', width: 0, height: 0, borderLeftWidth: 100, borderRightWidth: 100, borderBottomWidth: 300, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(63, 100, 126, 0.6)' }} />
      <View style={{ position: 'absolute', bottom: '13%', right: '-5%', width: 0, height: 0, borderLeftWidth: 90, borderRightWidth: 90, borderBottomWidth: 280, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(63, 100, 126, 0.7)' }} />

      {/* Ground Layer */}
      <LinearGradient
        colors={['rgba(63, 100, 126, 0.8)', '#141e30']}
        style={{ position: 'absolute', bottom: '-50%', left: 0, right: 0, height: '65%' }}
      />
    </Animated.View>
  );
};

const Airplane = ({ top, duration, delay, progress, direction = 1 }: { top: string | number, duration: number, delay: number, progress: Animated.SharedValue<number>, direction?: number }) => {
  const floatX = useSharedValue(0);

  useEffect(() => {
    const distance = direction === 1 ? 3000 : -3000; // Expanded to guarantee it crosses the entire screen
    floatX.value = withDelay(delay, withRepeat(withTiming(distance, { duration, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(floatX);
  }, [duration, delay, direction]);

  const style = useAnimatedStyle(() => {
    // Airplanes slowly fade into existence only at higher altitudes
    // They then fade away gracefully as you ascend into the upper atmosphere
    const opacity = interpolate(progress.value, [15, 30, 50, 70], [0, 0.5, 0.5, 0], 'clamp');
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
    opacity: interpolate(progress.value, [50, 80], [0, 1], 'clamp')
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

  const { height } = useWindowDimensions();

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [60, 80, 100, 110], [0, 0.7, 1, 0], 'clamp'),
    transform: [
      { translateY: interpolate(progress.value, [60, 90, 100, 110], [40, 0, 0, height + 200], 'clamp') + floatY.value },
      { scale: interpolate(progress.value, [80, 100, 110], [0.8, 3.5, 0], 'clamp') }
    ]
  }));
  
  return (
    <Animated.View style={[{ position: 'absolute', left: '50%', top: '25%', marginLeft: -40, marginTop: -40, width: 80, height: 80 }, style]} pointerEvents="none">
      {/* Atmospheric Moon Radiation / Glow */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FFFDF5', borderRadius: 40, shadowColor: '#FFFDF5', shadowOpacity: 1, shadowRadius: 80, elevation: 20 }]} />
      
      {/* Moon Surface and Craters */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FFFDF5', borderRadius: 40, overflow: 'hidden' }]}>
        <View style={{ position: 'absolute', top: 18, left: 20, width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(0, 0, 0, 0.05)' }} />
        <View style={{ position: 'absolute', top: 45, left: 45, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0, 0, 0, 0.03)' }} />
        <View style={{ position: 'absolute', top: 52, left: 16, width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(0, 0, 0, 0.06)' }} />
        <View style={{ position: 'absolute', top: 25, left: 55, width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(0, 0, 0, 0.04)' }} />
        <View style={{ position: 'absolute', top: 38, left: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0, 0, 0, 0.03)' }} />
      </View>
    </Animated.View>
  );
};

const Satellite = ({ top, duration, delay, progress, direction = 1 }: { top: string | number, duration: number, delay: number, progress: Animated.SharedValue<number>, direction?: number }) => {
  const floatX = useSharedValue(0);
  useEffect(() => {
    const distance = direction === 1 ? 3000 : -3000;
    floatX.value = withDelay(delay, withRepeat(withTiming(distance, { duration, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(floatX);
  }, [duration, delay, direction]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [50, 70], [0, 0.5], 'clamp'),
    transform: [{ translateX: floatX.value }, { scaleX: direction }]
  }));
  return <Animated.View style={[{ position: 'absolute', top, left: direction === 1 ? -50 : '110%', alignItems: 'center', justifyContent: 'center' }, style]} pointerEvents="none">
    <View style={{ width: 8, height: 6, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 1, marginBottom: 1 }} />
    <View style={{ width: 14, height: 4, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 2 }} />
    <View style={{ width: 8, height: 6, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 1, marginTop: 1 }} />
  </Animated.View>;
};

const Mars = ({ progress }: { progress: Animated.SharedValue<number> }) => {
  const { height, width } = useWindowDimensions();
  const style = useAnimatedStyle(() => {
    const startProgress = 120;
    const endProgress = 150;
    const opacity = interpolate(progress.value, [startProgress - 5, startProgress, endProgress, endProgress + 5], [0, 1, 1, 0], 'clamp');
    const translateY = interpolate(progress.value, [startProgress, endProgress], [-100, height + 100]);
    const translateX = interpolate(progress.value, [startProgress, endProgress], [width * 0.1, -width * 0.2]); // Drifting left
    return { opacity, transform: [{ translateX }, { translateY }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: '15%', width: 40, height: 40, borderRadius: 20, backgroundColor: '#b74b28', shadowColor: '#b74b28', shadowOpacity: 0.8, shadowRadius: 25 }, style]} pointerEvents="none" />
  );
};

const Jupiter = ({ progress }: { progress: Animated.SharedValue<number> }) => {
  const { height, width } = useWindowDimensions();
  const style = useAnimatedStyle(() => {
    const startProgress = 150;
    const endProgress = 190;
    const opacity = interpolate(progress.value, [startProgress - 10, startProgress, endProgress, endProgress + 10], [0, 1, 1, 0], 'clamp');
    const translateY = interpolate(progress.value, [startProgress, endProgress], [-400, height + 400]);
    return { opacity, transform: [{ translateY }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', right: -width * 0.5, width: 800, height: 800, borderRadius: 400, backgroundColor: '#c88b3a', shadowColor: '#c88b3a', shadowOpacity: 0.4, shadowRadius: 100, overflow: 'hidden' }, style]} pointerEvents="none">
       <View style={{ position: 'absolute', top: 180, width: '100%', height: 80, backgroundColor: 'rgba(255,255,255,0.06)'}} />
       <View style={{ position: 'absolute', top: 320, width: '100%', height: 140, backgroundColor: 'rgba(0,0,0,0.1)'}} />
       <View style={{ position: 'absolute', top: 520, width: '100%', height: 100, backgroundColor: 'rgba(255,255,255,0.08)'}} />
       <View style={{ position: 'absolute', top: 350, left: 150, width: 80, height: 50, borderRadius: 40, backgroundColor: 'rgba(150, 50, 20, 0.4)'}} />
    </Animated.View>
  );
};

const DeepSpaceSatellite = ({ top, duration, delay, progress, direction = 1 }: { top: string | number, duration: number, delay: number, progress: Animated.SharedValue<number>, direction?: number }) => {
  const floatX = useSharedValue(0);
  useEffect(() => {
    const distance = direction === 1 ? 3000 : -3000;
    floatX.value = withDelay(delay, withRepeat(withTiming(distance, { duration, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(floatX);
  }, [duration, delay, direction]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [130, 150, 990, 1000], [0, 0.7, 0.7, 0], 'clamp'),
    transform: [{ translateX: floatX.value }, { scaleX: direction }]
  }));
  return <Animated.View style={[{ position: 'absolute', top, left: direction === 1 ? -50 : '110%', alignItems: 'center', justifyContent: 'center' }, style]} pointerEvents="none">
    <View style={{ width: 12, height: 8, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 1, marginBottom: 1 }} />
    <View style={{ width: 22, height: 6, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 2 }} />
    <View style={{ width: 12, height: 8, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 1, marginTop: 1 }} />
  </Animated.View>;
};

const MovingStars = ({ progress }: { progress: Animated.SharedValue<number> }) => {
  const { height } = useWindowDimensions();
  const starsLayer1 = React.useMemo(() => [...Array(200)].map(() => ({ left: `${Math.random() * 100}%`, top: `${Math.random() * 4000 - 3900}%`, size: Math.random() * 2 + 1, opacity: Math.random() * 0.5 + 0.1 })), []);
  const starsLayer2 = React.useMemo(() => [...Array(200)].map(() => ({ left: `${Math.random() * 100}%`, top: `${Math.random() * 4000 - 3900}%`, size: Math.random() * 3 + 2, opacity: Math.random() * 0.8 + 0.4 })), []);
  
  const style1 = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [100, 106], [0, 1], 'clamp'),
    transform: [{ translateY: interpolate(progress.value, [106, 250], [0, height * 3.5]) }]
  }));
  const style2 = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [100, 106], [0, 1], 'clamp'),
    transform: [{ translateY: interpolate(progress.value, [106, 250], [0, height * 5.5]) }] // Faster parallax layer
  }));

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFillObject, style1]}>
        {starsLayer1.map((s, i) => <View key={`l1-${i}`} style={{ position: 'absolute', left: s.left, top: s.top, width: s.size, height: s.size, backgroundColor: '#FFF', borderRadius: s.size, opacity: s.opacity }} />)}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFillObject, style2]}>
        {starsLayer2.map((s, i) => <View key={`l2-${i}`} style={{ position: 'absolute', left: s.left, top: s.top, width: s.size, height: s.size, backgroundColor: '#FFF', borderRadius: s.size, opacity: s.opacity }} />)}
      </Animated.View>
    </View>
  );
};

const CosmicFog = ({ progress }: { progress: Animated.SharedValue<number> }) => {
  const { height } = useWindowDimensions();
  const style1 = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [106, 120, 180, 200], [0, 0.4, 0.4, 0], 'clamp'),
    transform: [{ translateY: interpolate(progress.value, [106, 200], [0, height]) }]
  }));
  const style2 = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [130, 150, 190, 200], [0, 0.3, 0.3, 0], 'clamp'),
    transform: [{ translateY: interpolate(progress.value, [120, 200], [0, height * 1.5]) }]
  }));
  
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Animated.View style={[{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', backgroundColor: 'rgba(80, 50, 100, 0.1)', borderRadius: 1000 }, style1]} />
      <Animated.View style={[{ position: 'absolute', top: '-10%', right: '-50%', width: '150%', height: '150%', backgroundColor: 'rgba(40, 80, 120, 0.1)', borderRadius: 800 }, style2]} />
    </View>
  );
};

const Comet = ({ progress, startProgress, duration, top, direction = 1 }: { progress: Animated.SharedValue<number>, startProgress: number, duration: number, top: string | number, direction?: number }) => {
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(direction === 1 ? -200 : width + 200);

  useEffect(() => {
    translateX.value = withDelay(
      Math.random() * 8000, // Random start delay
      withRepeat(
        withTiming(direction === 1 ? width + 200 : -200, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );
    return () => cancelAnimation(translateX);
  }, [width, duration, direction]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [startProgress - 5, startProgress, 990, 1000], [0, 0.7, 0.7, 0], 'clamp'),
    transform: [{ translateX: translateX.value }, { rotate: direction === 1 ? '-15deg' : '195deg' }]
  }));

  return <Animated.View style={[{ position: 'absolute', top }, style]} pointerEvents="none"><LinearGradient colors={['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: 120, height: 1, borderRadius: 1 }} /></Animated.View>;
};

const CosmicPlanet = ({ progress, startProgress, left, size, color }: { progress: Animated.SharedValue<number>, startProgress: number, left: string | number, size: number, color: string }) => {
  const { height } = useWindowDimensions();
  const style = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [startProgress - 10, startProgress, startProgress + 30, startProgress + 40], [0, 1, 1, 0], 'clamp');
    const translateY = interpolate(progress.value, [startProgress - 10, startProgress + 40], [-size, height + size], 'clamp');
    return { opacity, transform: [{ translateY }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left, width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} pointerEvents="none" />
  );
};

export const Background = ({ children, progress }: Props) => {
  const breath = useSharedValue(0);
  const panY = useSharedValue(0);
  const { scale } = useResponsive();

  // This hook efficiently reacts to the game's progress to drive the parallax effect
  useAnimatedReaction(
    () => progress.value,
    (currentProgress) => {
    const panScore = 7; // Wait until score 7 before moving the background
    const targetPanY = Math.max(0, (currentProgress - panScore) * GameConfig.BLOCK_HEIGHT);
    
    // Cinematic Parallax: Earth sinks at 35% the speed of the blocks so it stays visible much longer!
    panY.value = withSpring(targetPanY * 0.35, cameraSpring);
    },
    [progress]
  );

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
      { translateX: (breath.value - 0.5) * 15 * scale },
      { translateY: (breath.value - 0.5) * 10 * scale }
    ]
  }));

  const cloudWidth1 = 200 * scale;
  const cloudWidth2 = 140 * scale;
  const cloudWidth3 = 220 * scale;

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

        <DistantTrees progress={progress} panY={panY} />
        
        <Cloud width={cloudWidth1} left="-10%" top="15%" duration={18000} delay={0} progress={progress} />
        <Cloud width={cloudWidth2} left="60%" top="30%" duration={22000} delay={1000} progress={progress} />
        <Cloud width={cloudWidth3} left="20%" top="55%" duration={25000} delay={2000} progress={progress} />

        <Bird top="25%" duration={25000} delay={0} progress={progress} direction={1} />
        <Bird top="22%" duration={30000} delay={4000} progress={progress} direction={-1} />
        <Bird top="45%" duration={28000} delay={8000} progress={progress} direction={1} />
        
        <Airplane top="18%" duration={50000} delay={5000} progress={progress} direction={1} />
        <Airplane top="35%" duration={55000} delay={15000} progress={progress} direction={-1} />

        <Satellite top="20%" duration={60000} delay={8000} progress={progress} direction={1} />
        <Satellite top="45%" duration={65000} delay={18000} progress={progress} direction={-1} />

        {/* Final Cosmic Sequence Drifting Elements */}
        <MovingStars progress={progress} />
        <CosmicFog progress={progress} />
        <Mars progress={progress} />
        <DeepSpaceSatellite top="35%" duration={45000} delay={5000} progress={progress} direction={-1} />
        <DeepSpaceSatellite top="15%" duration={55000} delay={25000} progress={progress} direction={1} />
        <Jupiter progress={progress} />

        <CosmicPlanet progress={progress} startProgress={110} left="15%" size={80} color="rgba(255, 255, 255, 0.04)" />
        <CosmicPlanet progress={progress} startProgress={118} left="80%" size={50} color="rgba(200, 220, 255, 0.05)" />
        <CosmicPlanet progress={progress} startProgress={130} left="65%" size={140} color="rgba(255, 255, 255, 0.02)" />
        <CosmicPlanet progress={progress} startProgress={145} left="5%" size={100} color="rgba(255, 210, 240, 0.03)" />
        <Comet progress={progress} startProgress={105} duration={8000} top="15%" direction={1} />
        <Comet progress={progress} startProgress={115} duration={10000} top="60%" direction={-1} />
        <Comet progress={progress} startProgress={125} duration={7000} top="40%" direction={1} />
        
        <Comet progress={progress} startProgress={150} duration={6000} top="25%" direction={-1} />
        <Comet progress={progress} startProgress={165} duration={9000} top="75%" direction={1} />
        <Comet progress={progress} startProgress={180} duration={5000} top="10%" direction={-1} />
      </View>
      {children}
    </View>
  );
};
