import { useEffect, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

export function useAudio() {
  const isEnabled = useRef(true);
  const webAudioNormal = useRef<HTMLAudioElement | null>(null);
  const webAudioPerfect = useRef<HTMLAudioElement | null>(null);

  const normalUri = 'https://s3.amazonaws.com/freecodecamp/simonSound1.mp3'; // Soft tone
  const perfectUri = 'https://s3.amazonaws.com/freecodecamp/simonSound2.mp3'; // Harmonic tone

  // Modern expo-audio API handles preloading internally
  const normalPlayer = useAudioPlayer(normalUri);
  const perfectPlayer = useAudioPlayer(perfectUri);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
        webAudioNormal.current = new window.Audio(normalUri);
        webAudioPerfect.current = new window.Audio(perfectUri);
      }
    }
  }, []);

  const playTone = async (isPerfect: boolean) => {
    if (!isEnabled.current) return;
    
    try {
      if (Platform.OS === 'web') {
        const player = isPerfect ? webAudioPerfect.current : webAudioNormal.current;
        if (player) {
          player.currentTime = 0; // Reset to start instantly
          player.play().catch(() => {});
        }
        return;
      }

      const player = isPerfect ? perfectPlayer : normalPlayer;
      if (player) {
        player.seekTo(0);
        player.play();
      }
    } catch (e) { 
      console.warn("Audio play failed:", e); 
    }
  };

  return { playTone };
}