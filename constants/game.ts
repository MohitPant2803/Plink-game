import { Dimensions } from 'react-native';

export const GameConfig = {
  get SCREEN_WIDTH() { return Math.min(Dimensions.get('window').width, 500); },
  get SCREEN_HEIGHT() { return Dimensions.get('window').height; },
  get INITIAL_BLOCK_WIDTH() { return this.SCREEN_WIDTH * 0.45; }, // Fits within the middle
  MIN_BLOCK_WIDTH: 15,
  get BLOCK_HEIGHT() { return this.SCREEN_WIDTH * 0.08; }, // Reduced height
  INITIAL_SPEED: 3500,
  SPEED_MULTIPLIER: 1.0,
  PERFECT_TOLERANCE: 60,
  get MAX_OSCILLATION() { return (this.SCREEN_WIDTH - this.INITIAL_BLOCK_WIDTH) / 2; }, // Prevents extending outside
};
