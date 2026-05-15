import React from 'react';
import { View, StyleSheet, Text, Pressable, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, runOnJS, useSharedValue, FadeInDown, FadeIn, withSequence, withTiming, Easing, withDelay, withRepeat, cancelAnimation, interpolate, useAnimatedReaction } from 'react-native-reanimated';
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
  const translateX = useSharedValue(piece.xOffset);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    // Gravity acceleration simulation, organic rotation, and fade
    translateY.value = withTiming(800, { duration: 1500, easing: Easing.in(Easing.quad) });
    // Add a horizontal "kick" to make the slice feel more physical and accurate
    translateX.value = withTiming(piece.xOffset + (piece.direction * 40), { duration: 1500, easing: Easing.out(Easing.quad) });
    rotate.value = withTiming(piece.direction * 120, { duration: 1500, easing: Easing.out(Easing.ease) });
    opacity.value = withTiming(0, { duration: 1500, easing: Easing.in(Easing.quad) });
  }, [piece.direction, piece.xOffset, rotate, translateY, translateX, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
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
      <Text style={styles.storyText}>{text}</Text>
    </Animated.View>
  );
};

const FinalCinematicMessage = ({ text, delayStart, visibleDuration, fadeDuration = 1500 }: { text: string, delayStart: number, visibleDuration: number, fadeDuration?: number }) => {
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
      <Text style={[{ color: '#FFFDF5', fontSize: 24, fontStyle: 'italic', letterSpacing: 2, textAlign: 'center', fontWeight: '600', textShadowColor: 'rgba(11, 19, 43, 0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }]}>{text}</Text>
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
    <Animated.View style={[{ position: 'absolute', top: '38%', width: '100%', alignItems: 'center', zIndex: 30000 }, useAnimatedStyle(() => ({ opacity: opacity.value }))]} pointerEvents="box-none">
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 6, textAlign: 'center', marginBottom: 12 }}>Created with love by</Text>
      <Text style={{ color: '#FFFDF5', fontSize: 32, fontWeight: '300', letterSpacing: 8, textAlign: 'center', marginBottom: 40, textShadowColor: 'rgba(11, 19, 43, 0.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 }}>MOHIT PANT</Text>
      <Animated.View style={useAnimatedStyle(() => ({ opacity: buttonOpacity.value }))} pointerEvents={cinematicDone ? "auto" : "none"}><View style={{ paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}><Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 3, fontWeight: '400' }}>Play Again</Text></View></Animated.View>
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
        withDelay(5500, withTiming(0, { duration: 1000 })),     // 11s: Looks down
        withDelay(13000, withTiming(3, { duration: 1000 })),    // 25s: Stop 12, looks at Earth
        withDelay(10000, withTiming(0, { duration: 1000 })),    // 36s: Restores
        withDelay(25000, withTiming(3, { duration: 1000 })),    // 62s: Stop 45, looks at Earth
        withDelay(14000, withTiming(0, { duration: 1000 })),    // 77s: Restores
        withDelay(32000, withTiming(-4, { duration: 1000 })),   // 110s: Stop 78, looks at moon
        withDelay(14000, withTiming(0, { duration: 1000 })),    // 125s: Restores
        withDelay(8000, withTiming(4, { duration: 1500 })),     // 134s: Stop 92, looks at staircase
        withDelay(14500, withTiming(0, { duration: 1000 })),    // 150s: Looks forward
        withDelay(5000, withTiming(4, { duration: 1500 })),     // 156s: Top, looks down at Earth
        withDelay(22500, withTiming(-6, { duration: 2000 }))    // 180s: Looks upward toward moon
      );

      standScale.value = withSequence(
        withDelay(25000, withTiming(0.7, { duration: 1000 })),  // 25s: Sits
        withDelay(10000, withTiming(1, { duration: 1000 })),    // 36s: Stands
        withDelay(7000, withTiming(0.85, { duration: 1000 })),  // 44s: Kneels
        withDelay(9000, withTiming(1, { duration: 1000 })),     // 54s: Stands
        withDelay(55000, withTiming(0.7, { duration: 1000 })),  // 110s: Sits
        withDelay(14000, withTiming(1, { duration: 1000 }))     // 125s: Stands
      );

      earRotate.value = withSequence(
        withDelay(10000, withSequence(withTiming(25, { duration: 200 }), withTiming(15, { duration: 200 }))), // 10s: Subtly twitches
        withDelay(14600, withTiming(35, { duration: 1000 })),   // 25s: Droops
        withDelay(10000, withTiming(15, { duration: 1000 })),   // 36s: Restores
        withDelay(7000, withTiming(5, { duration: 1000 })),     // 44s: Lifts
        withDelay(9000, withTiming(15, { duration: 1000 })),    // 54s: Restores
        withDelay(55000, withTiming(35, { duration: 1000 })),   // 110s: Droops
        withDelay(14000, withTiming(15, { duration: 1000 }))    // 125s: Restores
      );

      eyeScale.value = withSequence(
        withDelay(44000, withTiming(1.3, { duration: 1000 })),  // 44s: Widens
        withDelay(9000, withTiming(1, { duration: 1000 })),     // 54s: Restores
        withDelay(104000, withTiming(0.8, { duration: 1000 })), // 158s: Squints
        withDelay(19000, withTiming(1, { duration: 1000 }))     // 178s: Restores
      );

      tremble.value = withSequence(
        withDelay(17800, withRepeat(withTiming(0.8, { duration: 45 }), 20, true)), // 17.8s: First jump
        withTiming(0, { duration: 0 }),
        withDelay(29100, withRepeat(withTiming(0.6, { duration: 45 }), 40, true)), // 47.8s: Realization
        withTiming(0, { duration: 0 }),
        withDelay(19200, withRepeat(withTiming(0.8, { duration: 45 }), 60, true)), // 68.8s: Cloud loss
        withTiming(0, { duration: 0 }),
        withDelay(16300, withRepeat(withTiming(0.6, { duration: 45 }), 60, true)), // 87.8s: Airplane struggle
        withTiming(0, { duration: 0 })
      );

      handOpacity.value = withSequence(
        withDelay(44000, withTiming(1, { duration: 1000 })), // 44s: Reaches to touch
        withDelay(5000, withTiming(0, { duration: 1000 })),  // 50s: Retracts
        withDelay(11000, withTiming(1, { duration: 1000 })), // 62s: Reaches outward
        withDelay(5000, withTiming(0, { duration: 1000 }))   // 68s: Retracts
      );

      handX.value = withSequence(
        withDelay(44000, withTiming(8, { duration: 1500, easing: Easing.out(Easing.sin) })),
        withDelay(4500, withTiming(0, { duration: 1000 })),
        withDelay(12000, withTiming(8, { duration: 1500, easing: Easing.out(Easing.sin) })),
        withDelay(4500, withTiming(0, { duration: 1000 }))
      );

      localStepX.value = withSequence(
        withDelay(180000, withTiming(-5, { duration: 1000, easing: Easing.inOut(Easing.sin) })) // 180s: Step backward
      );

      creatureOpacity.value = withSequence(
        withDelay(184500, withTiming(0, { duration: 2000 })) // 184.5s: Dissolve into light
      );

      glowOpacity.value = withSequence(
        withDelay(184000, withTiming(1, { duration: 1000 })),
        withTiming(0, { duration: 2000 })
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
          <FloatingText text="I really thought nobody was coming." delayStart={10000} visibleDuration={3200} />
          <FloatingText text="After a while… I stopped waiting." delayStart={14500} visibleDuration={3000} /> 

          {/* Stop 12: Second Emotional Climb */}
          <FloatingText text="I used to stare at the moon every night." delayStart={24000} visibleDuration={3000} />
          <FloatingText text="Never Knew if I could ever go back." delayStart={28500} visibleDuration={3000} />
          <FloatingText text="Then I saw you trying." delayStart={33000} visibleDuration={3000} />

          {/* Stop 28: Emotional Realization */}
          <FloatingText text="IDK why but You just kept building..." delayStart={43000} visibleDuration={2500} />
          <FloatingText text="Step by step." delayStart={47000} visibleDuration={2200} />
          <FloatingText text="I just prayed that you win." delayStart={51000} visibleDuration={3000} />

          {/* Stop 45: Cloud-phase loss */}
          <FloatingText text="I used to have a home." delayStart={61000} visibleDuration={3000} />
          <FloatingText text="People who cared." delayStart={65500} visibleDuration={2500} />
          <FloatingText text={"And then one day...\neverything changed."} delayStart={69500} visibleDuration={3000} />
          <FloatingText text="I didn't even get to say goodbye." delayStart={74000} visibleDuration={3000} />

          {/* Stop 62: Airplane-phase struggle */}
          <FloatingText text="I tried so many times to move forward." delayStart={84000} visibleDuration={3500} />
          <FloatingText text="But something always pulled me back down." delayStart={89000} visibleDuration={3500} />
          <FloatingText text="After some time…" delayStart={94000} visibleDuration={2500} />
          <FloatingText text="you start believing you're the problem." delayStart={98000} visibleDuration={3500} />

          {/* Stop 78: Satellite-phase loneliness */}
          <FloatingText text="I got tired of hoping." delayStart={108500} visibleDuration={3000} />
          <FloatingText text="Tired of waiting." delayStart={113000} visibleDuration={2500} />
          <FloatingText text="Tired of feeling left behind." delayStart={117000} visibleDuration={3000} />
          <FloatingText text="So I stopped asking for help." delayStart={121500} visibleDuration={3500} />

          {/* Stop 92: Final emotional stop */}
          <FloatingText text={"But then...\nyou stayed."} delayStart={132000} visibleDuration={3500} />
          <FloatingText text="You kept building." delayStart={137000} visibleDuration={3000} />
          <FloatingText text="Even when you didn't know who it was for." delayStart={141500} visibleDuration={3500} />
          <FloatingText text="Nobody's ever done that for me before." delayStart={146500} visibleDuration={3500} />

          {/* FINAL JUMP MOMENT */}
          <FloatingText text="I thought I was too far gone." delayStart={156000} visibleDuration={3500} />
          <FloatingText text="Like maybe some people just stay lost forever." delayStart={161000} visibleDuration={4000} />
          <FloatingText text={"But somehow...\nyou helped me believe again."} delayStart={166500} visibleDuration={4000} />
          <FloatingText text="Thank you..." delayStart={172000} visibleDuration={3000} />
          <FloatingText text="for not giving up on me." delayStart={176500} visibleDuration={4000} />
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

  const cinematicTime = useSharedValue(0);
  const animX = useSharedValue({ times: [0], vals: [0] });
  const animY = useSharedValue({ times: [0], vals: [0] });
  const animCam = useSharedValue({ times: [0], vals: [0] });

  useAnimatedReaction(
    () => cinematicTime.value,
    (time) => {
      if (gameWon && animX.value.times.length > 1) {
        creatureStepX.value = interpolate(time, animX.value.times, animX.value.vals, 'clamp');
        creatureJumpY.value = interpolate(time, animY.value.times, animY.value.vals, 'clamp');
        cameraTargetY.value = interpolate(time, animCam.value.times, animCam.value.vals, 'clamp');
      }
    }
  );

  React.useEffect(() => {
    if (gameWon) {
      // Subtly shrink the tower into nothingness as the camera ascends to deep space
      cinematicZoom.value = withDelay(185000, withTiming(0.01, { duration: 30000, easing: Easing.inOut(Easing.quad) }));
      
      const blocksToMid = Math.floor((windowHeight * 0.3) / GameConfig.BLOCK_HEIGHT);

      const pushKeyframe = (times: number[], vals: number[], time: number, val: number) => {
        if (times.length > 0 && time <= times[times.length - 1]) time = times[times.length - 1] + 1;
        times.push(time); vals.push(val);
      };
      const pushArcY = (tY: number[], vY: number[], startTime: number, duration: number, startY: number, peakY: number, endY: number) => {
        const dt = duration / 4;
        if (startTime > tY[tY.length - 1]) pushKeyframe(tY, vY, startTime, startY);
        pushKeyframe(tY, vY, startTime + dt, startY + (peakY - startY) * 0.75);
        pushKeyframe(tY, vY, startTime + 2 * dt, peakY);
        pushKeyframe(tY, vY, startTime + 3 * dt, endY + (peakY - endY) * 0.75);
        pushKeyframe(tY, vY, startTime + duration, endY);
      };

      const tX = [0]; const vX = [0];
      const tY = [0]; const vY = [0];
      const initialCam = Math.max(0, (stack.length - blocksToMid) * GameConfig.BLOCK_HEIGHT);
      const tCam = [0]; const vCam = [initialCam];

      pushKeyframe(tX, vX, 15000, 0);
      pushKeyframe(tX, vX, 16000, stack.length > 1 ? stack[1].xOffset * 0.5 : 0);
      pushKeyframe(tX, vX, 16600, stack.length > 1 ? stack[1].xOffset : 0);
      let lastX = 16600;

      pushKeyframe(tY, vY, 16000, 0);
      pushArcY(tY, vY, 16000, 600, 0, -GameConfig.BLOCK_HEIGHT - 15, -GameConfig.BLOCK_HEIGHT);
      let lastY = 16600;

      pushKeyframe(tCam, vCam, 3000, 0);
      let lastCam = 3000;

      const addJump = (i: number, startTime: number, duration: number) => {
         if (startTime > lastX) pushKeyframe(tX, vX, startTime, vX[vX.length - 1]);
         pushKeyframe(tX, vX, startTime + duration, stack[i].xOffset);
         lastX = startTime + duration;

         const startY = vY[vY.length - 1];
         const peakY = -i * GameConfig.BLOCK_HEIGHT - 15;
         const endY = -i * GameConfig.BLOCK_HEIGHT;
         pushArcY(tY, vY, startTime, duration, startY, peakY, endY);
         lastY = startTime + duration;

         const target = Math.max(0, (i - blocksToMid) * GameConfig.BLOCK_HEIGHT);
         if (startTime > lastCam) pushKeyframe(tCam, vCam, startTime, vCam[vCam.length - 1]);
         pushKeyframe(tCam, vCam, startTime + duration, target);
         lastCam = startTime + duration;
      };

      let t = 19000;
      for (let i = 2; i <= 12 && i < stack.length - 1; i++) { addJump(i, t, 350); t += 350; }  // Climb 1 (ends 23k)
      t = 38000;
      for (let i = 13; i <= 28 && i < stack.length - 1; i++) { addJump(i, t, 250); t += 250; } // Climb 2 (ends 42k)
      t = 56000;
      for (let i = 29; i <= 45 && i < stack.length - 1; i++) { addJump(i, t, 235); t += 235; } // Climb 3 (ends 60k)
      t = 79000;
      for (let i = 46; i <= 62 && i < stack.length - 1; i++) { addJump(i, t, 235); t += 235; } // Climb 4 (ends 83k)
      t = 103500;
      for (let i = 63; i <= 78 && i < stack.length - 1; i++) { addJump(i, t, 250); t += 250; } // Climb 5 (ends 107.5k)
      t = 127000;
      for (let i = 79; i <= 92 && i < stack.length - 1; i++) { addJump(i, t, 285); t += 285; } // Climb 6 (ends 131k)
      t = 152000;
      for (let i = 93; i < stack.length - 1; i++) { addJump(i, t, 350); t += 350; }            // Final Ascent

      // The Final Heartbreaking Jump into the Moon
      pushKeyframe(tY, vY, 182000, vY[vY.length - 1]);
      const startFinalY = vY[vY.length - 1];
      const startFinalCam = vCam[vCam.length - 1];
      // Sends the creature straight into the physical center of the Moon
      const endFinalY = -windowHeight * 0.55 - startFinalCam;
      pushKeyframe(tY, vY, 183000, startFinalY + (endFinalY - startFinalY) * 0.4);
      pushKeyframe(tY, vY, 184000, startFinalY + (endFinalY - startFinalY) * 0.8);
      pushKeyframe(tY, vY, 185000, endFinalY);
      
      // Endless Upward Ascension Sequence (Rocketing the camera up so the shrinking tower falls far below)
      pushKeyframe(tCam, vCam, 185000, vCam[vCam.length - 1]);
      const ascensionStartCam = vCam[vCam.length - 1];
      pushKeyframe(tCam, vCam, 230000, ascensionStartCam + windowHeight * 3.5);

      animX.value = { times: tX, vals: vX };
      animY.value = { times: tY, vals: vY };
      animCam.value = { times: tCam, vals: vCam };
      
      cinematicTime.value = 0;
      cinematicTime.value = withTiming(240000, { duration: 240000, easing: Easing.linear });

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
              <FinalCinematicMessage text="No matter how lost you feel..." delayStart={188000} visibleDuration={2500} fadeDuration={1500} />
              <FinalCinematicMessage text="You are never truly alone." delayStart={194000} visibleDuration={2500} fadeDuration={1500} />
              <FinalCinematicMessage text="Some journeys just take longer." delayStart={200000} visibleDuration={2500} fadeDuration={1500} />
              <FinalCinematicMessage text="You do not need to see the whole path..." delayStart={206000} visibleDuration={2500} fadeDuration={1500} />
              <FinalCinematicMessage text="Just the next step." delayStart={212000} visibleDuration={2500} fadeDuration={1500} />
              <FinalCinematicMessage text="Even the smallest light..." delayStart={218000} visibleDuration={2500} fadeDuration={1500} />
              <FinalCinematicMessage text="...can guide someone home." delayStart={224000} visibleDuration={3000} fadeDuration={1500} />
              <FinalCinematicMessage text="You will find your way too." delayStart={230500} visibleDuration={4000} fadeDuration={2000} />
              <FinalCredits delayStart={238500} cinematicDone={cinematicDone} />
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
                speed={Math.max(GameConfig.INITIAL_SPEED * Math.pow(GameConfig.SPEED_MULTIPLIER, stack.length), 750)} // Increased max speed for a better late-game challenge
                speed={Math.max(GameConfig.INITIAL_SPEED * Math.pow(GameConfig.SPEED_MULTIPLIER, stack.length), 600)} // Further increased max speed for a greater challenge
                direction={stack.length % 2 === 0 ? 1 : -1}
                translateX={translateX}
                gameOver={gameOver}
              />
            </View>
          )}
        </Animated.View>

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
  storyText: {
    color: '#FFFDF5',
    fontSize: 19,
    fontStyle: 'italic',
    letterSpacing: 2,
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(11, 19, 43, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6
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
