import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export function useAudio() {
  const isEnabled = useRef(true);
  const normalSound = useRef<Audio.Sound | null>(null);
  const perfectSound = useRef<Audio.Sound | null>(null);
  const webAudioNormal = useRef<HTMLAudioElement | null>(null);
  const webAudioPerfect = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        // Configures audio to be soft, ambient, and respectful of the user's device
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        // Using reliable, high-quality .mp3 URLs (iOS does NOT support .ogg!)
        const normalUri = 'https://s3.amazonaws.com/freecodecamp/simonSound1.mp3'; // Soft tone
        const perfectUri = 'https://s3.amazonaws.com/freecodecamp/simonSound2.mp3'; // Harmonic tone

        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
            webAudioNormal.current = new window.Audio(normalUri);
            webAudioPerfect.current = new window.Audio(perfectUri);
          }
        } else {
          // Preload sounds into memory for instant zero-latency playback!
          const { sound: nSound } = await Audio.Sound.createAsync({ uri: normalUri });
          const { sound: pSound } = await Audio.Sound.createAsync({ uri: perfectUri });
          normalSound.current = nSound;
          perfectSound.current = pSound;
        }
      } catch (e) {
        console.warn("Audio setup failed:", e);
      }
    };

    setupAudio();

    return () => {
      if (normalSound.current) normalSound.current.unloadAsync();
      if (perfectSound.current) perfectSound.current.unloadAsync();
    };
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

      const player = isPerfect ? perfectSound.current : normalSound.current;
      if (player) {
        await player.replayAsync(); // instantly restarts the preloaded sound
      }
    } catch (e) { 
      console.warn("Audio play failed:", e); 
    }
  };

  return { playTone };
}