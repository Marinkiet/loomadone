import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useElevenLabs } from '@/hooks/useElevenLabs';

interface NarratorButtonProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  size?: number;
}

export default function NarratorButton({ 
  position = 'top-right',
  size = 40
}: NarratorButtonProps) {
  const { isNarratorEnabled, toggleNarrator, isLoading } = useElevenLabs();

  const getPositionStyle = (): any => {
    switch (position) {
      case 'top-right':
        return { top: 10, right: 10 };
      case 'bottom-right':
        return { bottom: 70, right: 10 };
      case 'top-left':
        return { top: 50, left: 10 };
      case 'bottom-left':
        return { bottom: 10, left: 10 };
      default:
        return { top: 10, right: 10 };
    }
  };

  return (
    <View style={[styles.container, getPositionStyle()]}>
      <TouchableOpacity
        style={[
          styles.button,
          { width: size, height: size, borderRadius: size / 2 },
          isNarratorEnabled && styles.buttonActive
        ]}
        onPress={toggleNarrator}
        disabled={isLoading}
      >
        <Ionicons
          name={isNarratorEnabled ? "volume-high" : "volume-mute"} 
          size={size * 0.6}
          color={isNarratorEnabled ? theme.colors.accent : "#fff"}
        /> 
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
  }, 
  button: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonActive: {
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
});