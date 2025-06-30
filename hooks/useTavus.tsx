import { useState, createContext, useContext } from 'react';
import { Alert } from 'react-native';

// Fixed AI tutor replica ID
const AI_TUTOR_REPLICA_ID = 're2185788693';

// 🔑 Get Tavus API key from environment variables
const TAVUS_API_KEY = process.env.EXPO_PUBLIC_TAVUS_API_KEY;

interface TavusContextType {
  isLoading: boolean;
  error: string | null;
  callUrl: string | null;
  startTutorCall: (topicName: string, userName: string) => Promise<string | null>;
  clearCall: () => void;
}

const TavusContext = createContext<TavusContextType | undefined>(undefined);

export function useTavus() {
  const context = useContext(TavusContext);
  if (context === undefined) {
    throw new Error('useTavus must be used within a TavusProvider');
  }
  return context;
}

export function TavusProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callUrl, setCallUrl] = useState<string | null>(null);

  const startTutorCall = async (topicName: string, userName: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setCallUrl(null);

      // Check if API key is configured
      if (!TAVUS_API_KEY || TAVUS_API_KEY === 'YOUR_TAVUS_API_KEY_HERE') {
        Alert.alert(
          'API Key Required',
          'Please add your Tavus API key to the .env file as EXPO_PUBLIC_TAVUS_API_KEY to use the AI tutor feature.',
          [{ text: 'OK', style: 'default' }]
        );
        return null;
      }

      console.log(`Starting Tavus call with replica ${AI_TUTOR_REPLICA_ID} for topic ${topicName}`);

      // Simplified request body with only essential properties
      const requestBody = {
        replica_id: AI_TUTOR_REPLICA_ID,
        conversation_name: `Tutoring Session on ${topicName}`,
        conversational_context: `You're tutoring the student on the topic "${topicName}". Make it engaging and helpful. Be encouraging and explain concepts clearly. Ask questions to check understanding and provide examples when needed.`,
        custom_greeting: `Hi ${userName}! I'm excited to help you learn about ${topicName} today. What would you like to explore first?`,
        properties: {
          max_call_duration: 1800,
          enable_recording: false,
          language: 'english'
        }
      };

      const options = {
        method: 'POST',
        headers: {
          'x-api-key': TAVUS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      };

      console.log('Tavus API Request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://tavusapi.com/v2/conversations', options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Tavus API Error Response:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Tavus API Response:', data);
      
      const url = data?.call_url || data?.join_url || data?.conversation_url;

      if (!url) {
        console.error('Full Tavus response:', JSON.stringify(data, null, 2));
        throw new Error('No call URL received from Tavus API');
      }

      console.log('Received call URL:', url);
      setCallUrl(url);
      return url;

    } catch (error: any) {
      console.error('Error starting Tavus call:', error);
      setError(error.message || 'Failed to start AI tutor call');
      
      if (error.message?.includes('maximum concurrent conversations')) {
        Alert.alert(
          'Maximum Sessions Reached',
          'You have reached the maximum number of AI tutor calls. Please close other sessions or wait a moment.',
          [{ text: 'OK', style: 'default' }]
        );
      } else if (error.message.includes('HTTP 401') || error.message.includes('Unauthorized')) {
        Alert.alert(
          'Invalid API Key',
          'Your Tavus API key appears to be invalid. Please check your API key in the .env file.',
          [{ text: 'OK', style: 'default' }]
        );
      } else if (error.message.includes('HTTP 429')) {
        Alert.alert(
          'Rate Limit Exceeded',
          'Too many requests. Please wait a moment before trying again.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert(
          'Connection Error',
          'Failed to connect to AI tutor. Please check your internet connection and try again.',
          [{ text: 'OK', style: 'default' }]
        );
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCall = () => {
    setCallUrl(null);
    setError(null);
  };

  return (
    <TavusContext.Provider
      value={{
        isLoading,
        error,
        callUrl,
        startTutorCall,
        clearCall,
      }}
    >
      {children}
    </TavusContext.Provider>
  );
}