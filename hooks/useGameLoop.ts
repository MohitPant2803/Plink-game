import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { GameConfig } from '../constants/game';
import { useAudio } from './useAudio';

export interface BlockData {
  id: number;
  width: number;
  xOffset: number;
  colorIndex: number;
  isPerfect?: boolean;
}

export interface SlicedPieceData {
  id: number;
  width: number;
  xOffset: number;
  colorIndex: number;
  yIndex: number;
  direction: number;
}

export function useGameLoop() {
  const { playTone } = useAudio();
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [stack, setStack] = useState<BlockData[]>([
    { id: 0, width: GameConfig.INITIAL_BLOCK_WIDTH, xOffset: 0, colorIndex: 0 }, // Base stationary block
    { id: 1, width: GameConfig.INITIAL_BLOCK_WIDTH, xOffset: 0, colorIndex: 1 }, // First moving block
  ]);
  const [slicedPieces, setSlicedPieces] = useState<SlicedPieceData[]>([]);

  const restart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStack([
      { id: 0, width: GameConfig.INITIAL_BLOCK_WIDTH, xOffset: 0, colorIndex: 0 },
      { id: 1, width: GameConfig.INITIAL_BLOCK_WIDTH, xOffset: 0, colorIndex: 1 },
    ]);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setSlicedPieces([]);
  }, []);

  const handleTap = useCallback((currentX: number) => {
    if (gameOver || gameWon) return restart();

    setStack((prev) => {
      const movingBlock = prev[prev.length - 1];
      const baseBlock = prev[prev.length - 2];
      
      const distance = Math.abs(currentX - baseBlock.xOffset);
      
      // Perfect match
      if (distance <= GameConfig.PERFECT_TOLERANCE) {
        // Stronger, richer tactile feedback for a perfect drop
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        playTone(true);
        
        // Expand slightly as a reward
        const newWidth = Math.min(movingBlock.width + 10, GameConfig.INITIAL_BLOCK_WIDTH);
        
        const placedBlock = {
          ...movingBlock,
          xOffset: baseBlock.xOffset, // Snaps perfectly visually
          isPerfect: true, // Flag for visual glow
        };
        const newBlock = {
          id: prev.length,
          width: newWidth,
          xOffset: baseBlock.xOffset,
          colorIndex: prev.length % 5,
        };
        
        setScore((s) => {
          const nextScore = s + 1;
          if (nextScore >= 100) setGameWon(true);
          return nextScore;
        });
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

      let sliceWidth = 0;
      let sliceOffset = 0;
      let direction = 1;

      if (movingRight > baseRight) {
        sliceWidth = movingRight - baseRight;
        sliceOffset = baseRight + sliceWidth / 2;
        direction = 1;
      } else if (movingLeft < baseLeft) {
        sliceWidth = baseLeft - movingLeft;
        sliceOffset = movingLeft + sliceWidth / 2;
        direction = -1;
      }

      if (newWidth >= GameConfig.MIN_BLOCK_WIDTH) {
        // Softer tactile feedback for a slice
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        playTone(false);
        const newOffset = overlapLeft + newWidth / 2;

        const placedBlock = { ...movingBlock, width: newWidth, xOffset: newOffset };
        const newBlock = {
          id: prev.length,
          width: newWidth,
          xOffset: newOffset,
          colorIndex: prev.length % 5,
        };

        if (sliceWidth > 0) {
          setSlicedPieces((sp) => [...sp.slice(-5), {
            id: Date.now() + Math.random(),
            width: sliceWidth,
            xOffset: sliceOffset,
            colorIndex: movingBlock.colorIndex,
            yIndex: prev.length - 1,
            direction
          }]);
        }
        
        setScore((s) => {
          const nextScore = s + 1;
          if (nextScore >= 100) setGameWon(true);
          return nextScore;
        });
        return [...prev.slice(0, -1), placedBlock, newBlock];
      }

      // Missed completely or sliced too thin
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // Softer, more peaceful end
      setGameOver(true);

      if (newWidth > 0) {
        const newOffset = overlapLeft + newWidth / 2;
        const placedBlock = { ...movingBlock, width: newWidth, xOffset: newOffset };
        return [...prev.slice(0, -1), placedBlock];
      }

      return [...prev.slice(0, -1), { ...movingBlock, xOffset: currentX }];
    });
  }, [gameOver]);


  return { stack, score, gameOver, gameWon, handleTap, restart, slicedPieces };
}
