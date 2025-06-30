export const theme = {
  colors: {
   primary: '#3DB99C',         // Darkened Mint Green (accessible primary)
    secondary: '#5A45C7',       // Deeper Indigo (better contrast)
    accent: '#E85C5C',          // Rich Coral Red (less glare)
    surfaceLight: '#C9D7F0',    // Muted Powder Blue (card background)
    base: '#F5F5F5',            // App base, off-white
    text: '#1A1A1A',            // Very dark gray (softer than pure black)
    success: '#2DA66F',         // Balanced success green
    error: '#D9363E',           // Slightly deeper red for contrast
    warning: '#E6B800',         // Warm gold yellow
    info: '#369FD0',            // Muted Sky Blue (replaces sharp cyan)
    background: '#EDEFF2',      // Pale gray for app background
    surface: '#FFFFFF',         // Standard card/container white
    border: '#D1D5DB',          // Subtle light gray border
    textSecondary: '#555C68'    // Soft charcoal gray for subtitles
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  typography: {
    heading: {
      fontSize: 24,
      fontWeight: '700',
      color: '#3D2B1F',
    },
    subheading: {
      fontSize: 18,
      fontWeight: '600',
      color: '#3D2B1F',
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      color: '#3D2B1F',
    },
    caption: {
      fontSize: 14,
      fontWeight: '400',
      color: '#3D2B1F',
    },
  },
  buttons: {
    primary: {
      backgroundColor: '#A05F38',
      color: '#FFFFFF',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    secondary: {
      backgroundColor: '#FCE9CD',
      color: '#3D2B1F',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#3D2B1F',
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
  },
  cards: {
    backgroundColor: '#FCE9CD',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#A05F38',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
};