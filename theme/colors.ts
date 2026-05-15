export const Colors = {
  background: {
    top: '#E8F0FE',
    bottom: '#F8F9FA',
  },

  sky: [
    ['#E0F2FE', '#F8FAFC'], // 0-10: Soft blue daytime sky to horizon white
    ['#CBE0F8', '#E0F2FE'], // 10-20: Climbing higher into the blue
    ['#B6D0F2', '#EAE4F2'], // 20-30: Approaching lavender mist
    ['#EAE4F2', '#FDF0E6'], // 30-40: Entering soft peach light
    ['#FDF0E6', '#CBE0F8'], // 40-50: Higher altitudes
    ['#CBE0F8', '#9ABCE4'], // 50-60: Deepening sky blue
    ['#9ABCE4', '#6B90C2'], // 60-70: Fading sunset tones
    ['#6B90C2', '#2D4A70'], // 70-80: Entering dusk
    ['#2D4A70', '#132640'], // 80-90: Deepening twilight
    ['#132640', '#0B132B'], // 90-100: Near space
    ['#0B132B', '#020617'], // 100+: Deep space / stillness
    ['#020617', '#1A2436'], // 110+: Moon glow atmosphere
  ],

  blocks: [
    '#AEC6CF',
    '#FFDAB9',
    '#A2E4B8',
    '#E6E6FA',
    '#F4C2C2',
  ],

  text: {
    primary: '#4A4A4A',
    secondary: '#8E8E93',
  },

  ui: {
    shadow: 'rgba(142, 142, 147, 0.15)', // Ultra-soft ambient shadow
    highlight: 'rgba(255, 255, 255, 0.5)', // Gentle depth highlight
  },
};