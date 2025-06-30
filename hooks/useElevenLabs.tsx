import { useState, createContext, useContext } from 'react';
import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const DEFAULT_VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2'; // Default voice ID
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

interface ElevenLabsContextType {
  isLoading: boolean;
  error: string | null;
  speakText: (text: string, voiceId?: string) => Promise<void>;
  stopSpeaking: () => void;
  isNarratorEnabled: boolean;
  toggleNarrator: () => void;
}

const ElevenLabsContext = createContext<ElevenLabsContextType | undefined>(undefined);

export function useElevenLabs() {
  const context = useContext(ElevenLabsContext);
  if (context === undefined) {
    throw new Error('useElevenLabs must be used within an ElevenLabsProvider');
  }
  return context;
}

// Helper function to wait for a specified delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to make API request with retry logic
const makeElevenLabsRequest = async (text: string, voiceId: string, retryCount = 0): Promise<Response> => {
  try {
    console.log(`Making ElevenLabs API request (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    
    const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.8,
        },
      }),
    });

    // If we get a 429 (rate limit) error and haven't exceeded max retries, retry with exponential backoff
    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`Rate limit hit, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
      await delay(retryDelay);
      return makeElevenLabsRequest(text, voiceId, retryCount + 1);
    }

    return response;
  } catch (error) {
    // If it's a network error and we haven't exceeded max retries, retry
    if (retryCount < MAX_RETRIES) {
      const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`Network error, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
      await delay(retryDelay);
      return makeElevenLabsRequest(text, voiceId, retryCount + 1);
    }
    throw error;
  }
};
export function ElevenLabsProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | HTMLAudioElement | null>(null);
  const [isNarratorEnabled, setIsNarratorEnabled] = useState(false);

  const toggleNarrator = () => {
    setIsNarratorEnabled(prev => !prev);
  };

  const stopSpeaking = () => {
    if (currentSound) {
      if (Platform.OS !== 'web') {
        // For native platforms
        currentSound.stopAsync?.();
        currentSound.unloadAsync?.();
      } else {
        // For web
        if (currentSound instanceof HTMLAudioElement) {
          currentSound.pause();
          currentSound.currentTime = 0;
        }
      }
      setCurrentSound(null);
    }
  };

  const speakText = async (text: string, voiceId: string = DEFAULT_VOICE_ID) => {
    if (!isNarratorEnabled) return;
    
    // Skip if text is empty or too short
    if (!text || text.length < 2) return;
    
    // Stop any current audio
    stopSpeaking();

    try {
      setIsLoading(true);
      setError(null);

      // Check if API key is configured
      if (!ELEVENLABS_API_KEY) {
        console.warn('ElevenLabs API key not configured');
        return;
      }

      console.log(`Speaking text: "${text}" with voice ID: ${voiceId}`);

      // Make API request to ElevenLabs with retry logic
      const response = await makeElevenLabsRequest(text, voiceId);

      if (!response || !response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Provide more specific error messages for common status codes
        let errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        
        if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
        } else if (response.status === 401) {
          errorMessage = 'Invalid API key. Please check your ElevenLabs API key configuration.';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden. Please check your ElevenLabs account permissions.';
        } else if (response.status >= 500) {
          errorMessage = 'ElevenLabs service is temporarily unavailable. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      // Get audio data
      const audioBlob = await response.blob();

      if (Platform.OS === 'web') {
        // Web implementation
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setCurrentSound(null);
        };
        setCurrentSound(audio);
        audio.play();
      } else {
        // Native implementation using Expo AV
        try {          
          // Import Expo AV dynamically to avoid issues on web
          const { Audio } = await import('expo-av');
          
          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            const base64Audio = base64data.split(',')[1];
            
            // Save to temporary file
            const fileUri = FileSystem.cacheDirectory + 'temp_audio.mp3';
            await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
              encoding: FileSystem.EncodingType.Base64,
            });
            
            // Play audio
            const { sound } = await Audio.Sound.createAsync( 
              { uri: fileUri },
              { shouldPlay: true }
            );
            
            setCurrentSound(sound);
            
            // Clean up when done
            sound.setOnPlaybackStatusUpdate(status => {
              if (status.didJustFinish) {
                sound.unloadAsync();
                FileSystem.deleteAsync(fileUri, { idempotent: true });
                setCurrentSound(null);
              }
            });
          };
        } catch (error) {
          console.error('Error playing audio:', error);
          throw new Error('Failed to play audio');
        }
      }
    } catch (error: any) {
      console.error('Error with ElevenLabs API:', error.message || error);
      setError(error.message || 'Failed to generate speech');
      
      // Show user-friendly alerts for specific error types
      if (error.message?.includes('Invalid API key') || error.message?.includes('401')) {
        Alert.alert(
          'API Key Error',
          'Your ElevenLabs API key appears to be invalid. Please check your API key configuration.',
          [{ text: 'OK', style: 'default' }]
        );  
      } else if (error.message?.includes('Rate limit exceeded') || error.message?.includes('429')) {
        Alert.alert(
          'Rate Limit Reached',
          'Too many requests to ElevenLabs API. The system has automatically retried, but the limit is still exceeded. Please wait a few minutes before trying again.',
          [{ text: 'OK', style: 'default' }]
        );
      } else if (error.message?.includes('service is temporarily unavailable')) {
        Alert.alert(
          'Service Unavailable',
          'ElevenLabs service is temporarily unavailable. Please try again in a few minutes.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert(
          'Text-to-Speech Error',
          'There was a problem with the text-to-speech service. Please try again later.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ElevenLabsContext.Provider
      value={{
        isLoading,
        error,
        speakText,
        stopSpeaking,
        isNarratorEnabled,
        toggleNarrator,
      }}
    >
      {children}
    </ElevenLabsContext.Provider>
  );
}