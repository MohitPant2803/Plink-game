import { useState, useCallback, useEffect } from 'react';
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
  const [cinematicDone, setCinematicDone] = useState(false);
  const [stack, setStack] = useState<BlockData[]>([
    { id: 0, width: GameConfig.INITIAL_BLOCK_WIDTH, xOffset: 0, colorIndex: 4 }, // Base stationary block (Pink)
    { id: 1, width: GameConfig.INITIAL_BLOCK_WIDTH, xOffset: 0, colorIndex: 0 }, // First moving block (Blue)
  ]);
  const [slicedPieces, setSlicedPieces] = useState<SlicedPieceData[]>([]);

  const restart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStack([
      { id: 0, width: GameConfig.INITIAL_BLOCK_WIDTH, xOffset: 0, colorIndex: 4 },
      { id: 1, width: GameConfig.INITIAL_BLOCK_WIDTH, xOffset: 0, colorIndex: 0 },
    ]);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setCinematicDone(false);
    setSlicedPieces([]);
  }, []);

  useEffect(() => {
    if (gameWon) {
      // Unlocks the "Tap to Restart" after the deeply emotional 155-second movie concludes
      const timer = setTimeout(() => setCinematicDone(true), 155000);
      return () => clearTimeout(timer);
    }
  }, [gameWon]);

  const handleTap = useCallback((currentX: number) => {
    if (gameOver) return restart();
    if (gameWon) {
      if (cinematicDone) return restart();
      return; // Block all taps while the emotional cinematic is playing!
    }

    setStack((prev) => {
      const movingBlock = prev[prev.length - 1];
      const baseBlock = prev[prev.length - 2];
      
      const distance = Math.abs(currentX - baseBlock.xOffset);
      
      // Perfect match
      if (distance <= GameConfig.PERFECT_TOLERANCE) {
        // Stronger, richer tactile feedback for a perfect drop
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        playTone(true);
        
        // Expand slightly as a reward, but strictly respect the absolute left/right bounds
        const maxLeft = -GameConfig.INITIAL_BLOCK_WIDTH / 2;
        const maxRight = GameConfig.INITIAL_BLOCK_WIDTH / 2;
        
        let targetWidth = movingBlock.width + 12; 
        let targetLeft = baseBlock.xOffset - targetWidth / 2;
        let targetRight = baseBlock.xOffset + targetWidth / 2;

        if (targetLeft < maxLeft) {
          targetLeft = maxLeft;
          targetRight = Math.min(maxRight, targetLeft + targetWidth); // Push expansion to the right
        } else if (targetRight > maxRight) {
          targetRight = maxRight;
          targetLeft = Math.max(maxLeft, targetRight - targetWidth); // Push expansion to the left
        }
        
        const finalWidth = targetRight - targetLeft;
        const finalOffset = targetLeft + finalWidth / 2;
        
        const placedBlock = {
          ...movingBlock,
          xOffset: baseBlock.xOffset, // Snaps perfectly visually
          isPerfect: true, // Flag for visual glow
        };
        const newBlock = {
          id: prev.length,
          width: finalWidth,
          xOffset: finalOffset,
          colorIndex: (prev.length - 1) % 5,
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
          colorIndex: (prev.length - 1) % 5,
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
  }, [gameOver, gameWon, playTone, restart]);


  return { stack, score, gameOver, gameWon, cinematicDone, handleTap, restart, slicedPieces };
}
