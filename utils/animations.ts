import { WithSpringConfig } from 'react-native-reanimated';

// Apple-like smooth spring, no chaotic bouncing
export const premiumSpring: WithSpringConfig = {
  damping: 20,
  stiffness: 120,
  mass: 1,
  overshootClamping: true,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 2,
};

// Heavy, cinematic upward drift with soft inertia
export const cameraSpring: WithSpringConfig = {
  damping: 50,
  stiffness: 40,
  mass: 3,
  overshootClamping: false, // Allows a tiny, natural float when settling
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 2,
};

// Subtle tactile pulse for the board when tapped
export const pulseSpring: WithSpringConfig = {
  damping: 20,
  stiffness: 150,
  mass: 1,
};

// Satisfying slight bounce for perfect alignments
export const perfectDropSpring: WithSpringConfig = {
  damping: 14,
  stiffness: 150,
  mass: 1,
};
