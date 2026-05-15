import React from 'react';
import { View, StyleSheet, Text, Pressable, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, runOnJS, useSharedValue, FadeInDown, FadeIn, withSequence, withTiming, Easing, withDelay, withRepeat, cancelAnimation, interpolate } from 'react-native-reanimated';
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
  cinematicDone: boolean;
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

// Attaches cinematic story dialogue precisely to the creature's coordinates
const FloatingText = ({ text, delayStart, visibleDuration, fadeDuration = 500 }: { text: string, delayStart: number, visibleDuration: number, fadeDuration?: number }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withSequence(
      withDelay(delayStart, withTiming(1, { duration: fadeDuration })),
      withDelay(visibleDuration, withTiming(0, { duration: fadeDuration }))
    );
    translateY.value = withSequence(
      withDelay(delayStart, withTiming(-10, { duration: fadeDuration + visibleDuration, easing: Easing.out(Easing.sin) })),
      withTiming(0, { duration: 0 })
    );
  }, [delayStart, visibleDuration, fadeDuration]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
  return (
    <Animated.View style={[{ position: 'absolute', bottom: 30, width: 250, left: -116, alignItems: 'center', zIndex: 20000 }, style]} pointerEvents="none">
      <Text style={[styles.storyText, { color: '#FFF', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }]}>{text}</Text>
    </Animated.View>
  );
};

const FinalCinematicMessage = ({ text, delayStart, visibleDuration, fadeDuration = 2000 }: { text: string, delayStart: number, visibleDuration: number, fadeDuration?: number }) => {
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withSequence(
      withDelay(delayStart, withTiming(1, { duration: fadeDuration })),
      withDelay(visibleDuration, withTiming(0, { duration: fadeDuration }))
    );
  }, [delayStart, visibleDuration, fadeDuration]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[{ position: 'absolute', top: '35%', width: '100%', alignItems: 'center', zIndex: 20000 }, style]} pointerEvents="none">
      <Text style={[{ color: '#FFF', fontSize: 18, fontStyle: 'italic', letterSpacing: 2, textAlign: 'center', fontWeight: '300', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }]}>{text}</Text>
    </Animated.View>
  );
};

const FinalCredits = ({ delayStart, cinematicDone }: { delayStart: number, cinematicDone: boolean }) => {
  const opacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withDelay(delayStart, withTiming(1, { duration: 3000 }));
    buttonOpacity.value = withDelay(delayStart + 5000, withTiming(1, { duration: 2000 }));
  }, [delayStart]);

  return (
    <Animated.View style={[{ position: 'absolute', bottom: '15%', width: '100%', alignItems: 'center', zIndex: 30000 }, useAnimatedStyle(() => ({ opacity: opacity.value }))]} pointerEvents="box-none">
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '200', fontStyle: 'italic', letterSpacing: 2, textAlign: 'center', marginBottom: 30 }}>Created with love by{'\n'}Mohit Pant</Text>
      <Animated.View style={useAnimatedStyle(() => ({ opacity: buttonOpacity.value }))} pointerEvents={cinematicDone ? "auto" : "none"}><View style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}><Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '300' }}>Play Again</Text></View></Animated.View>
    </Animated.View>
  );
};

// The tiny silent creature, waiting patiently
const Creature = ({ gameWon, stepX, jumpY, lastDropPerfect, stackLength }: { gameWon: boolean, stepX: Animated.SharedValue<number>, jumpY: Animated.SharedValue<number>, lastDropPerfect: boolean, stackLength: number }) => {
  const idleLookUp = useSharedValue(0);
  const breath = useSharedValue(1);
  const idleBlink = useSharedValue(1);
  const scarfWind = useSharedValue(0);
  const reliefBlink = useSharedValue(1);
  const tremble = useSharedValue(0);
  const standScale = useSharedValue(1);
  const earRotate = useSharedValue(15);
  const eyeScale = useSharedValue(1);
  const handOpacity = useSharedValue(0);
  const handX = useSharedValue(0);
  const localStepX = useSharedValue(0);
  const creatureOpacity = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (!gameWon) {
      tremble.value = 0;
      handOpacity.value = 0;
      earRotate.value = 15;
      eyeScale.value = 1;
      standScale.value = 1;
      localStepX.value = 0;
      creatureOpacity.value = 1;
      glowOpacity.value = 0;
      
      idleLookUp.value = withRepeat(
        withSequence(
          withDelay(8000, withTiming(-2, { duration: 2500, easing: Easing.inOut(Easing.sin) })),
          withDelay(4000, withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }))
        ),
        -1, false
      );

      breath.value = withRepeat(withTiming(0.96, { duration: 2500, easing: Easing.inOut(Easing.sin) }), -1, true);

      idleBlink.value = withRepeat(
        withSequence(
          withDelay(6000, withTiming(0, { duration: 350, easing: Easing.inOut(Easing.ease) })),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1, false
      );
    } else {
      // --- THE CINEMATIC REVEAL TIMELINE ---
      
      idleBlink.value = withDelay(6000, withSequence(withTiming(0, { duration: 300 }), withTiming(1, { duration: 300 })));
      
      idleLookUp.value = withSequence(
        withDelay(4000, withTiming(-4, { duration: 1500 })),    // 4s: Stares up
        withDelay(4500, withTiming(0, { duration: 1000 })),     // 10s: Looks down slightly
        withDelay(9500, withTiming(3, { duration: 1000 })),     // 20.5s: Stop 12, looks at Earth
        withDelay(6500, withTiming(0, { duration: 1000 })),     // 28s: Restores posture
        withDelay(31000, withTiming(3, { duration: 1000 })),    // 60s: Stop 62, looks at Earth
        withDelay(6000, withTiming(0, { duration: 1000 })),     // 67s: Restores posture
        withDelay(4500, withTiming(-4, { duration: 1000 })),    // 72.5s: Stop 78, looks at moon
        withDelay(6500, withTiming(0, { duration: 1000 })),     // 80s: Restores posture
        withDelay(5000, withTiming(4, { duration: 1500 })),     // 86s: Stop 92, looks at staircase below
        withDelay(6500, withTiming(0, { duration: 1000 })),     // 94s: Looks forward, climbs
        withDelay(6000, withTiming(4, { duration: 1500 })),     // 101s: Looks down at Earth
        withDelay(10500, withTiming(-6, { duration: 2000 }))    // 113s: Looks upward toward moon
      );

      standScale.value = withSequence(
        withDelay(20500, withTiming(0.7, { duration: 1000 })),  // 20.5s: Stop 12, Sits down
        withDelay(6500, withTiming(1, { duration: 1000 })),     // 28s: Stands
        withDelay(4500, withTiming(0.85, { duration: 1000 })),  // 33.5s: Stop 28, Kneels
        withDelay(6500, withTiming(1, { duration: 1000 })),     // 41s: Stands
        withDelay(30500, withTiming(0.7, { duration: 1000 })),  // 72.5s: Stop 78, Sits down
        withDelay(6500, withTiming(1, { duration: 1000 }))      // 80s: Stands
      );

      earRotate.value = withSequence(
        withDelay(10000, withSequence(withTiming(25, { duration: 200 }), withTiming(15, { duration: 200 }))), // 10s: Subtly twitches
        withDelay(10100, withTiming(35, { duration: 1000 })),   // 20.5s: Ears droop
        withDelay(6500, withTiming(15, { duration: 1000 })),    // 28s: Restores
        withDelay(4500, withTiming(5, { duration: 1000 })),     // 33.5s: Lifts curiously
        withDelay(6500, withTiming(15, { duration: 1000 })),    // 41s: Restores
        withDelay(30500, withTiming(35, { duration: 1000 })),   // 72.5s: Ears droop
        withDelay(6500, withTiming(15, { duration: 1000 }))     // 80s: Restores
      );

      eyeScale.value = withSequence(
        withDelay(33500, withTiming(1.3, { duration: 1000 })),  // 33.5s: Eyes widen subtly
        withDelay(6500, withTiming(1, { duration: 1000 })),     // 41s: Restores
        withDelay(44000, withTiming(0.8, { duration: 1000 })),  // 86s: Emotionally hits hard, squinting softly
        withDelay(7000, withTiming(1, { duration: 1000 }))      // 94s: Restores
      );

      tremble.value = withSequence(
        withDelay(14000, withRepeat(withTiming(0.8, { duration: 45 }), 20, true)), // 14s: First nervous jump
        withTiming(0, { duration: 0 }),
        withDelay(19100, withRepeat(withTiming(0.6, { duration: 45 }), 40, true)), // 34s: Emotional realization
        withTiming(0, { duration: 0 }),
        withDelay(12200, withRepeat(withTiming(0.8, { duration: 45 }), 60, true)), // 48s: Cloud loss tremble
        withTiming(0, { duration: 0 })
      );

      handOpacity.value = withSequence(
        withDelay(34000, withTiming(1, { duration: 1000 })), // 34s: Reaches to touch platform
        withDelay(5000, withTiming(0, { duration: 1000 })),  // 40s: Retracts
        withDelay(6000, withTiming(1, { duration: 1000 })),  // 47s: Reaches outward at clouds
        withDelay(6000, withTiming(0, { duration: 1000 }))   // 54s: Retracts
      );

      handX.value = withSequence(
        withDelay(34000, withTiming(8, { duration: 1500, easing: Easing.out(Easing.sin) })),
        withDelay(5000, withTiming(0, { duration: 1000 })),
        withDelay(6000, withTiming(8, { duration: 1500, easing: Easing.out(Easing.sin) })),
        withDelay(6000, withTiming(0, { duration: 1000 }))
      );

      localStepX.value = withSequence(
        withDelay(114000, withTiming(-5, { duration: 1000, easing: Easing.inOut(Easing.sin) })) // 114s: Step backward
      );

      creatureOpacity.value = withSequence(
        withDelay(117000, withTiming(0, { duration: 2000 })) // 117s: Dissolve into light
      );

      glowOpacity.value = withSequence(
        withDelay(116500, withTiming(1, { duration: 1500 })),
        withDelay(500, withTiming(0, { duration: 2000 }))
      );
    }

    // Gentle scarf blowing in the lonely wind
    scarfWind.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(5, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(idleLookUp);
      cancelAnimation(breath);
      cancelAnimation(idleBlink);
      cancelAnimation(scarfWind);
      cancelAnimation(tremble);
      cancelAnimation(standScale);
      cancelAnimation(earRotate);
      cancelAnimation(eyeScale);
      cancelAnimation(handOpacity);
      cancelAnimation(handX);
      cancelAnimation(localStepX);
      cancelAnimation(creatureOpacity);
      cancelAnimation(glowOpacity);
    };
  }, [gameWon]);

  React.useEffect(() => {
    if (lastDropPerfect && stackLength > 2) {
      // Soft, relieved eye close when the player gets a perfect drop
      reliefBlink.value = withSequence(
        withTiming(0, { duration: 150, easing: Easing.inOut(Easing.ease) }),
        withDelay(800, withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }))
      );
    }
  }, [stackLength, lastDropPerfect, reliefBlink]);

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: creatureOpacity.value,
    transform: [
      { scaleY: breath.value },
      { scaleY: standScale.value }
    ],
  }));

  const eyeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: idleLookUp.value },
      { scaleY: idleBlink.value * reliefBlink.value * eyeScale.value },
      { scaleX: eyeScale.value }
    ]
  }));
  
  const scarfStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${scarfWind.value - 15}deg` }]
  }));

  const earLeftStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `-${earRotate.value}deg` }] }));
  const earRightStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${earRotate.value}deg` }] }));
  
  const handStyle = useAnimatedStyle(() => ({
    opacity: handOpacity.value,
    transform: [{ translateX: handX.value }]
  }));

  const creatureRootStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      bottom: GameConfig.BLOCK_HEIGHT,
      left: '50%',
      marginLeft: -9,
      zIndex: 10000,
      transform: [
        { translateX: stepX.value + tremble.value + localStepX.value },
        { translateY: jumpY.value },
      ]
    }
  });

  return (
    <Animated.View style={[styles.creatureRoot, creatureRootStyle]}>
      {gameWon && (
        <>
          {/* Base: First Emotional Reveal */}
          <FloatingText text="I thought nobody heard me." delayStart={10000} visibleDuration={3000} />
          {/* Stop 12: Second Emotional Climb */}
          <FloatingText text="I used to watch the moon every night." delayStart={22000} visibleDuration={2500} />
          <FloatingText text="It made the nights feel smaller." delayStart={25500} visibleDuration={3000} />
          {/* Stop 28: Emotional Realization */}
          <FloatingText text="You kept building..." delayStart={35000} visibleDuration={2000} />
          <FloatingText text="That's what makes this beautiful." delayStart={38000} visibleDuration={3000} />
          {/* Stop 45: Cloud-phase loss */}
          <FloatingText text="My home used to drift above the clouds." delayStart={48000} visibleDuration={2500} />
          <FloatingText text={"One morning...\nit was gone."} delayStart={51500} visibleDuration={3000} />
          {/* Stop 62: Airplane-phase struggle */}
          <FloatingText text="I tried building before." delayStart={61000} visibleDuration={2500} />
          <FloatingText text="But every staircase fell apart." delayStart={64500} visibleDuration={3000} />
          {/* Stop 78: Satellite-phase loneliness */}
          <FloatingText text="I waited so long." delayStart={74000} visibleDuration={2500} />
          <FloatingText text="I stopped believing anyone was coming." delayStart={77500} visibleDuration={3000} />
          {/* Stop 92: Final emotional stop */}
          <FloatingText text={"But then...\nyou arrived."} delayStart={87000} visibleDuration={3000} />
          <FloatingText text="You carried me home." delayStart={91000} visibleDuration={3000} />
          {/* FINAL JUMP MOMENT */}
          <FloatingText text="I thought I was lost forever." delayStart={101000} visibleDuration={3000} />
          <FloatingText text={"But somehow...\nyou helped me find the way."} delayStart={106000} visibleDuration={4000} />
        </>
      )}
      <Animated.View style={[styles.creature, bodyStyle]}>
      {/* The Moonlight Dissolve Glow */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FFF', borderRadius: 9, shadowColor: '#FFF', shadowOpacity: 1, shadowRadius: 25 }, useAnimatedStyle(() => ({ opacity: glowOpacity.value }))]} pointerEvents="none" />
      
      {/* Cute little ears/antennae */}
      <Animated.View style={[styles.creatureEarLeft, earLeftStyle]} />
      <Animated.View style={[styles.creatureEarRight, earRightStyle]} />

      {/* Tiny lonely scarf */}
      <Animated.View style={[styles.creatureScarf, scarfStyle]} />
      <Animated.View style={[styles.creatureHand, handStyle]} />
      
      <Animated.View style={[{ flexDirection: 'row', gap: 4 }, eyeStyle]}>
        <View style={styles.creatureEye} />
        <View style={styles.creatureEye} />
      </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

// Mysterious fragmented poetic dialogue
const StoryMessage = ({ text, visible }: { text: string, visible: boolean }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40); // Starts much lower
  
  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 4000 });
      translateY.value = withTiming(0, { duration: 6000, easing: Easing.out(Easing.cubic) });
    } else {
      opacity.value = withTiming(0, { duration: 3000 });
      translateY.value = withTiming(-30, { duration: 4000 }); // Drifts upward into the atmosphere as it fades
    }
  }, [visible]);
  
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
  
  return <Animated.View style={[{ position: 'absolute', top: '28%', width: '100%', alignItems: 'center' }, style]} pointerEvents="none"><Text style={styles.storyText}>{text}</Text></Animated.View>;
}

export const GameBoard = ({ stack, score, gameOver, gameWon, cinematicDone, onTap, slicedPieces }: Props) => {
  const activeBlock = stack[stack.length - 1];
  const translateX = useSharedValue(0);
  const boardScale = useSharedValue(1);
  const cameraTargetY = useSharedValue(0);
  const creatureStepX = useSharedValue(0);
  const creatureJumpY = useSharedValue(0);
  const cinematicZoom = useSharedValue(1);
  const { height: windowHeight } = useWindowDimensions();

  React.useEffect(() => {
    if (gameWon) {
      cinematicZoom.value = withDelay(138000, withTiming(0.4, { duration: 10000, easing: Easing.inOut(Easing.cubic) }));
      
      // Generate the massive cinematic timeline for X, Y, and Camera!
      const seqX: any[] = [];
      const seqY: any[] = [];
      const seqCam: any[] = [];
      const blocksToMid = Math.floor((windowHeight * 0.3) / GameConfig.BLOCK_HEIGHT);

      // t=15s: Nervous tiny hesitation step forward
      seqX.push(withDelay(15000, withTiming(stack.length > 1 ? stack[1].xOffset * 0.5 : 0, { duration: 1000, easing: Easing.out(Easing.sin) })));
      // t=16s: Massive emotional first jump to block 1
      seqX.push(withTiming(stack.length > 1 ? stack[1].xOffset : 0, { duration: 600, easing: Easing.linear }));
      
      seqY.push(withDelay(16000, withTiming(-GameConfig.BLOCK_HEIGHT - 15, { duration: 300, easing: Easing.out(Easing.quad) })));
      seqY.push(withTiming(-GameConfig.BLOCK_HEIGHT, { duration: 300, easing: Easing.in(Easing.quad) }));

      // Initial Camera Pan down to perfectly show the endless staircase towering upward
      seqCam.push(withDelay(0, withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.cubic) })));

      let lastX = 16600;
      let lastY = 16600;
      let lastCam = 8000;

      const addJump = (i: number, startTime: number, duration: number) => {
         const delayX = startTime - lastX;
         if (delayX > 0) seqX.push(withDelay(delayX, withTiming(stack[i].xOffset, { duration })));
         else seqX.push(withTiming(stack[i].xOffset, { duration }));
         lastX = startTime + duration;

         const delayY = startTime - lastY;
         if (delayY > 0) seqY.push(withDelay(delayY, withTiming(-i * GameConfig.BLOCK_HEIGHT - 15, { duration: duration/2 })));
         else seqY.push(withTiming(-i * GameConfig.BLOCK_HEIGHT - 15, { duration: duration/2 }));
         seqY.push(withTiming(-i * GameConfig.BLOCK_HEIGHT, { duration: duration/2 }));
         lastY = startTime + duration;

         const target = Math.max(0, (i - blocksToMid) * GameConfig.BLOCK_HEIGHT);
         const delayCam = startTime - lastCam;
         if (delayCam > 0) seqCam.push(withDelay(delayCam, withTiming(target, { duration })));
         else seqCam.push(withTiming(target, { duration }));
         lastCam = startTime + duration;
      };

      // Execute the meticulously synchronized Master Ascending Timeline
      let t = 16600;
      for (let i = 2; i <= 12 && i < stack.length - 1; i++) { addJump(i, t, 340); t += 340; }  // Climb 1 to Scene 2
      t = 29000;
      for (let i = 13; i <= 28 && i < stack.length - 1; i++) { addJump(i, t, 250); t += 250; } // Climb 2 to Scene 3
      t = 42000;
      for (let i = 29; i <= 45 && i < stack.length - 1; i++) { addJump(i, t, 235); t += 235; } // Climb 3 to Cloud Phase
      t = 55000;
      for (let i = 46; i <= 62 && i < stack.length - 1; i++) { addJump(i, t, 235); t += 235; } // Climb 4 to Airplane Phase
      t = 68000;
      for (let i = 63; i <= 78 && i < stack.length - 1; i++) { addJump(i, t, 250); t += 250; } // Climb 5 to Satellite Phase
      t = 81000;
      for (let i = 79; i <= 92 && i < stack.length - 1; i++) { addJump(i, t, 285); t += 285; } // Climb 6 to Final Stop
      t = 95000;
      for (let i = 93; i < stack.length - 1; i++) { addJump(i, t, 350); t += 350; }            // Final Ascent

      // The Final Heartbreaking Jump into the Moon
      const finalDelayY = 115000 - lastY;
      seqY.push(withDelay(finalDelayY, withTiming(-stack.length * GameConfig.BLOCK_HEIGHT - 350, { duration: 5000, easing: Easing.out(Easing.cubic) })));
      
      // The Majestic Final Camera Zoom Out
      const finalDelayCam = 138000 - lastCam;
      seqCam.push(withDelay(finalDelayCam, withTiming((stack.length / 2) * GameConfig.BLOCK_HEIGHT, { duration: 10000, easing: Easing.inOut(Easing.cubic) })));

      creatureStepX.value = withSequence(...seqX as any);
      creatureJumpY.value = withSequence(...seqY as any);
      cameraTargetY.value = withSequence(...seqCam as any);

    } else {
      cinematicZoom.value = 1;
      creatureStepX.value = 0;
      creatureJumpY.value = 0;
      const blocksToMid = Math.floor((windowHeight * 0.3) / GameConfig.BLOCK_HEIGHT);
      cameraTargetY.value = withSpring(Math.max(0, (stack.length - blocksToMid) * GameConfig.BLOCK_HEIGHT), cameraSpring);
    }
  }, [stack.length, gameWon, windowHeight]);

  
  const cameraStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: cameraTargetY.value },
        { scale: boardScale.value * cinematicZoom.value }
      ],
    };
  });

  const tapGesture = Gesture.Tap().onStart(() => {
    if (!gameWon) {
    boardScale.value = withSequence(
      withTiming(0.995, { duration: 40 }), // Ultra subtle dip
      withSpring(1, pulseSpring) // Soft return
    );
    }
    runOnJS(onTap)(translateX.value);
  });

  const placedBlocks = gameOver ? stack : stack.slice(0, -1);
  const lastPlacedBlock = placedBlocks[placedBlocks.length - 1];
  const isLastPerfect = lastPlacedBlock?.isPerfect || false;
  const firstBlockX = stack.length > 1 ? stack[1].xOffset : 0;

  return (
    <GestureDetector gesture={tapGesture}>
      <View style={styles.container}>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <StoryMessage text="The moon used to feel closer." visible={score >= 50 && score < 58 && !gameWon} />
          <StoryMessage text="I kept building." visible={score >= 60 && score < 66 && !gameWon} />
          <StoryMessage text="So I waited." visible={score >= 68 && score < 74 && !gameWon} />
          <StoryMessage text="Days became years." visible={score >= 76 && score < 82 && !gameWon} />
          <StoryMessage text="I stopped asking for help." visible={score >= 84 && score < 89 && !gameWon} />
          <StoryMessage text={"After a while...\nyou stop believing anyone is coming."} visible={score >= 91 && score < 96 && !gameWon} />
          <StoryMessage text="But the moon still called me." visible={score >= 97 && score < 100 && !gameWon} />
          {gameWon && (
            <>
              <FinalCinematicMessage text="No matter how lost you feel..." delayStart={122000} visibleDuration={3000} />
              <FinalCinematicMessage text="You will find your way." delayStart={127000} visibleDuration={4000} />
              <FinalCinematicMessage text="One small step at a time." delayStart={133000} visibleDuration={4000} />
              <FinalCredits delayStart={146000} cinematicDone={cinematicDone} />
            </>
          )}
        </View>

        <Animated.View style={[styles.camera, cameraStyle]}>
          <Creature gameWon={gameWon} stepX={creatureStepX} jumpY={creatureJumpY} lastDropPerfect={isLastPerfect} stackLength={stack.length} />
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
          {/* SCENARIO 1: Game Over (Score is less than 100) -> Show Restart Option */}
{gameOver && score < 100 && (
  <Animated.View entering={FadeIn.duration(1500)} style={styles.restartOverlay}>
    <Animated.View entering={FadeInDown.duration(1200).delay(300).springify()} style={styles.scoreContainer}>
      <Text style={styles.gameOverText}>Beautiful run</Text>
      <Text style={styles.scoreBoardText}>{score}</Text>
      <Text style={styles.tapToRestartText}>Tap to drift again</Text>
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
    borderRadius: Math.max(8, GameConfig.BLOCK_HEIGHT * 0.3),
    position: 'absolute',
    borderTopWidth: 1.5,
    borderColor: '#E8F0FE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  activeLayer: { position: 'absolute', width: '100%', left: 0, alignItems: 'center', zIndex: 9999 },
  restartOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(253, 251, 247, 0.85)',
    zIndex: 100,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  gameOverText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    marginBottom: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scoreBoardText: {
    fontSize: 48,
    fontWeight: '200',
    color: '#4A4A4A',
    marginBottom: 24,
  },
  tapToRestartText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.6,
  },
  storyText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 16,
    fontStyle: 'italic',
    letterSpacing: 2,
    textAlign: 'center',
    fontWeight: '300'
  },
  creature: {
    width: 18,
    height: 14,
    backgroundColor: '#1C3144',
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    alignItems: 'center',
    paddingTop: 4,
    shadowColor: '#1C3144',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  creatureEarLeft: {
    position: 'absolute',
    top: -3,
    left: 3,
    width: 4,
    height: 5,
    backgroundColor: '#1C3144',
    borderRadius: 2,
  },
  creatureEarRight: {
    position: 'absolute',
    top: -3,
    right: 3,
    width: 4,
    height: 5,
    backgroundColor: '#1C3144',
    borderRadius: 2,
  },
  creatureScarf: {
    position: 'absolute',
    right: -5,
    top: 6,
    width: 8,
    height: 3,
    backgroundColor: '#925e78', // A muted cinematic rust/rose tone
    borderBottomRightRadius: 2,
    borderTopRightRadius: 2,
    zIndex: -1,
  },
  creatureEye: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#FFF',
    shadowOpacity: 0.8,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  creatureHand: {
    position: 'absolute',
    right: -2,
    top: 8,
    width: 4,
    height: 3,
    backgroundColor: '#1C3144',
    borderRadius: 2,
  }
});
