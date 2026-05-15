import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { GameConfig } from '../constants/game';

export interface BlockData {
  id: number;
  width: number;
  xOffset: number;
  colorIndex: number;
}

export function useGameLoop() {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [stack, setStack] = useState<BlockData[]>([
    { id: 0, width: GameConfig.INITIAL_BLOCK_WIDTH, xOffset: 0, colorIndex: 0 }, // Base stationary block
    { id: 1, width: GameConfig.INITIAL_BLOCK_WIDTH, xOffset: 0, colorIndex: 1 }, // First moving block
  ]);

  const handleTap = useCallback((currentX: number) => {
    if (gameOver) return;

    setStack((prev) => {
      const movingBlock = prev[prev.length - 1];
      const baseBlock = prev[prev.length - 2];
      
      const distance = Math.abs(currentX - baseBlock.xOffset);
      
      // Perfect match
      if (distance <= GameConfig.PERFECT_TOLERANCE) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Expand slightly as a reward
        const newWidth = Math.min(movingBlock.width + 10, GameConfig.INITIAL_BLOCK_WIDTH);
        
        const placedBlock = {
          ...movingBlock,
          xOffset: baseBlock.xOffset, // Snaps perfectly visually
        };
        const newBlock = {
          id: prev.length,
          width: newWidth,
          xOffset: baseBlock.xOffset,
          colorIndex: prev.length % 5,
        };
        
        setScore((s) => s + 1);
        return [...prev.slice(0, -1), placedBlock, newBlock];
      }

      // Sliced
      const baseLeft = baseBlock.xOffset - baseBlock.width / 2;
      const baseRight = baseBlock.xOffset + baseBlock.width / 2;
      const movingLeft = currentX - movingBlock.width / 2;
      const movingRight = currentX + movingBlock.width / 2;

      const overlapLeft = Math.max(baseLeft, movingLeft);
      const overlapRight = Math.min(baseRight, movingRight);
      const newWidth = overlapRight - overlapLeft;

      if (newWidth >= GameConfig.MIN_BLOCK_WIDTH) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const newOffset = overlapLeft + newWidth / 2;

        const placedBlock = { ...movingBlock, width: newWidth, xOffset: newOffset };
        const newBlock = {
          id: prev.length,
          width: newWidth,
          xOffset: newOffset,
          colorIndex: prev.length % 5,
        };
        
        setScore((s) => s + 1);
        return [...prev.slice(0, -1), placedBlock, newBlock];
      }

      // Missed completely or sliced too thin
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setGameOver(true);

      if (newWidth > 0) {
        const newOffset = overlapLeft + newWidth / 2;
        const placedBlock = { ...movingBlock, width: newWidth, xOffset: newOffset };
        return [...prev.slice(0, -1), placedBlock];
      }

      return [...prev.slice(0, -1), { ...movingBlock, xOffset: currentX }];
    });
  }, [gameOver]);

  const restart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStack([
      { id: 0, width: GameConfig.INITIAL_BLOCK_WIDTH, xOffset: 0, colorIndex: 0 },
      { id: 1, width: GameConfig.INITIAL_BLOCK_WIDTH, xOffset: 0, colorIndex: 1 },
    ]);
    setScore(0);
    setGameOver(false);
  };

  return { stack, score, gameOver, handleTap, restart };
}
