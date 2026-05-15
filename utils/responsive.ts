import { useWindowDimensions } from 'react-native';

export const useResponsive = () => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Scale factor based on width (375 is standard phone width)
  const scale = screenWidth / 375;

  return {
    screenWidth,
    screenHeight,
    scale,
    // Responsive typography
    fontSize: {
      xs: 10 * scale,
      sm: 12 * scale,
      md: 14 * scale,
      lg: 16 * scale,
      xl: 20 * scale,
      xxl: 24 * scale,
      hero: 32 * scale,
      mega: 56 * scale,
    },
    // Responsive spacing
    spacing: {
      xs: 4 * scale,
      sm: 8 * scale,
      md: 12 * scale,
      lg: 16 * scale,
      xl: 20 * scale,
      xxl: 28 * scale,
      xxxl: 40 * scale,
    },
    // Responsive sizing
    sizing: {
      blockHeight: 32 * scale,
      buttonPadding: 12 * scale,
      borderRadius: 16 * scale,
      shadowRadius: 12 * scale,
    },
  };
};
