import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const GameConfig = {
  SCREEN_WIDTH: width,
  SCREEN_HEIGHT: height,
  INITIAL_BLOCK_WIDTH: width * 0.65,
  MIN_BLOCK_WIDTH: 15,
  BLOCK_HEIGHT: 40,
  INITIAL_SPEED: 1800, // ms to cross screen
  SPEED_MULTIPLIER: 0.98, // Speeds up slightly each tap
  PERFECT_TOLERANCE: 5, // Pixels of forgiveness for a "Perfect" drop
  MAX_OSCILLATION: width * 0.4, 
};
