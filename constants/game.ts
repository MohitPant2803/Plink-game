import { Dimensions } from 'react-native';

export const GameConfig = {
  get SCREEN_WIDTH() { return Math.min(Dimensions.get('window').width, 500); },
  get SCREEN_HEIGHT() { return Dimensions.get('window').height; },
  get INITIAL_BLOCK_WIDTH() { return this.SCREEN_WIDTH * 0.9; },
  MIN_BLOCK_WIDTH: 15,
  BLOCK_HEIGHT: 40,
  INITIAL_SPEED: 3500, // ms to cross screen (Very slow)
  SPEED_MULTIPLIER: 1.0, // Speeds up very slowly for a meditative feel (Set to 1.0 so it never speeds up)
  PERFECT_TOLERANCE: 60, // Pixels of forgiveness for a "Perfect" drop (Massive forgiveness)
  get MAX_OSCILLATION() { return this.SCREEN_WIDTH * 0.4; },
};
