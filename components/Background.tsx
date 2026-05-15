import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';

export const Background = ({ children }: { children: React.ReactNode }) => {
  return (
    <LinearGradient
      colors={[Colors.background.top, Colors.background.bottom]}
      style={StyleSheet.absoluteFillObject}
    >
      {children}
    </LinearGradient>
  );
};
