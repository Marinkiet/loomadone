import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  PanGestureHandler,
  Animated
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Subject configurations
const subjectConfigs = {
  Math: {
    title: 'Mathematical Realm',
    backgroundColor: '#2D1B69',
    description: 'Solve equations and master mathematical concepts!',
    gameType: 'puzzle'
  },
  'Life Science': {
    title: 'Biological Biome', 
    backgroundColor: '#1B4332',
    description: 'Explore the wonders of living organisms!',
    gameType: 'exploration'
  },
  English: {
    title: 'Literary Landscape',
    backgroundColor: '#4A1A2C',
    description: 'Master language and literature!',
    gameType: 'adventure'
  },
  Physics: {
    title: 'Physics Laboratory',
    backgroundColor: '#1A365D', 
    description: 'Understand the laws of the universe!',
    gameType: 'simulation'
  }
};

// Game objects for each subject
const gameObjects = {
  Math: [
    { id: 1, type: 'equation', x: 300, y: 200, color: '#FFD700', size: 50, label: '2x+5=15' },
    { id: 2, type: 'formula', x: 150, y: 350, color: '#FF6B35', size: 45, label: 'a²+b²=c²' },
    { id: 3, type: 'graph', x: 450, y: 150, color: '#4ECDC4', size: 55, label: 'y=mx+b' }
  ],
  'Life Science': [
    { id: 1, type: 'cell', x: 250, y: 180, color: '#10B981', size: 60, label: 'Cell Structure' },
    { id: 2, type: 'dna', x: 400, y: 300, color: '#3B82F6', size: 50, label: 'DNA Helix' },
    { id: 3, type: 'leaf', x: 180, y: 400, color: '#059669', size: 55, label: 'Photosynthesis' }
  ],
  English: [
    { id: 1, type: 'book', x: 320, y: 220, color: '#8B5CF6', size: 50, label: 'Literature' },
    { id: 2, type: 'pen', x: 200, y: 350, color: '#EC4899', size: 45, label: 'Writing' },
    { id: 3, type: 'speech', x: 420, y: 180, color: '#F59E0B', size: 55, label: 'Grammar' }
  ],
  Physics: [
    { id: 1, type: 'atom', x: 280, y: 200, color: '#EF4444', size: 55, label: 'Atomic Structure' },
    { id: 2, type: 'wave', x: 380, y: 320, color: '#06B6D4', size: 50, label: 'Wave Motion' },
    { id: 3, type: 'magnet', x: 160, y: 380, color: '#8B5CF6', size: 45, label: 'Magnetism' }
  ]
};

export default function GameScreen() {
  const params = useLocalSearchParams();
  const subject = params.subject as string;
  const subtopic = params.subtopic as string;
  
  const [playerPosition, setPlayerPosition] = useState({ x: 100, y: 100 });
  const [gameLoaded, setGameLoaded] = useState(false);
  const [collectedItems, setCollectedItems] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  
  const playerAnim = useRef(new Animated.Value(1)).current;
  const panRef = useRef<PanGestureHandler>(null);

  const config = subjectConfigs[subject as keyof typeof subjectConfigs];
  const objects = gameObjects[subject as keyof typeof gameObjects] || [];

  useEffect(() => {
    setGameLoaded(true);
    
    // Start player idle animation
    const idleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(playerAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(playerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    idleAnimation.start();

    return () => idleAnimation.stop();
  }, []);

  const handlePlayerMove = (gestureState: any) => {
    const { dx, dy } = gestureState;
    const gameWidth = screenWidth - 100;
    const gameHeight = screenHeight - 200;
    
    setPlayerPosition(prev => ({
      x: Math.max(20, Math.min(gameWidth - 40, prev.x + dx * 0.5)),
      y: Math.max(20, Math.min(gameHeight - 40, prev.y + dy * 0.5))
    }));
  };

  const checkCollision = (objX: number, objY: number, objSize: number) => {
    const distance = Math.sqrt(
      Math.pow(playerPosition.x - objX, 2) + Math.pow(playerPosition.y - objY, 2)
    );
    return distance < (objSize / 2 + 20);
  };

  const handleObjectInteraction = (object: any) => {
    if (collectedItems.includes(object.id)) return;

    setCollectedItems(prev => [...prev, object.id]);
    setScore(prev => prev + 10);

    // Show subject-specific interaction
    switch (subject) {
      case 'Math':
        showMathChallenge(object);
        break;
      case 'Life Science':
        showBiologyDiscovery(object);
        break;
      case 'English':
        showEnglishActivity(object);
        break;
      case 'Physics':
        showPhysicsExperiment(object);
        break;
    }
  };

  const showMathChallenge = (object: any) => {
    Alert.alert(
      '🧮 Math Challenge!',
      `You discovered: ${object.label}\n\nReady to solve some problems?`,
      [
        { text: 'Start Challenge', onPress: () => router.push('/game-cards') },
        { text: 'Continue Exploring', style: 'cancel' }
      ]
    );
  };

  const showBiologyDiscovery = (object: any) => {
    Alert.alert(
      '🔬 Biology Discovery!',
      `You found: ${object.label}\n\nExplore this concept further?`,
      [
        { text: 'Start Learning', onPress: () => router.push('/game-cards') },
        { text: 'Continue Exploring', style: 'cancel' }
      ]
    );
  };

  const showEnglishActivity = (object: any) => {
    Alert.alert(
      '📚 Language Adventure!',
      `You discovered: ${object.label}\n\nDive into interactive stories?`,
      [
        { text: 'Start Adventure', onPress: () => router.push('/game-cards') },
        { text: 'Continue Exploring', style: 'cancel' }
      ]
    );
  };

  const showPhysicsExperiment = (object: any) => {
    Alert.alert(
      '⚗️ Physics Lab!',
      `You found: ${object.label}\n\nConduct virtual experiments?`,
      [
        { text: 'Start Experiment', onPress: () => router.push('/game-cards') },
        { text: 'Continue Exploring', style: 'cancel' }
      ]
    );
  };

  const handleBackToMap = () => {
    router.back();
  };

  const resetGame = () => {
    setPlayerPosition({ x: 100, y: 100 });
    setCollectedItems([]);
    setScore(0);
  };

  if (!config) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Subject not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToMap}>
            <Text style={styles.backButtonText}>Back to Map</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleBackToMap}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.base} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{config.title}</Text>
          <Text style={styles.headerSubtitle}>{subtopic || 'Adventure Mode'}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={resetGame}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={24} color={theme.colors.base} />
        </TouchableOpacity>
      </View>

      {/* Score Display */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreItem}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
        <View style={styles.scoreItem}>
          <Ionicons name="trophy" size={16} color="#FF6B35" />
          <Text style={styles.scoreText}>Items: {collectedItems.length}/{objects.length}</Text>
        </View>
      </View>

      {/* Game Area */}
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={(event) => handlePlayerMove(event.nativeEvent)}
      >
        <Animated.View style={styles.gameArea}>
          {/* Game Objects */}
          {objects.map((object) => {
            const isCollected = collectedItems.includes(object.id);
            const isNearPlayer = checkCollision(object.x, object.y, object.size);
            
            return (
              <TouchableOpacity
                key={object.id}
                style={[
                  styles.gameObject,
                  {
                    left: object.x,
                    top: object.y,
                    width: object.size,
                    height: object.size,
                    backgroundColor: isCollected ? '#666' : object.color,
                    opacity: isCollected ? 0.3 : 1,
                    borderWidth: isNearPlayer && !isCollected ? 3 : 0,
                    borderColor: '#FFD700'
                  }
                ]}
                onPress={() => handleObjectInteraction(object)}
                disabled={isCollected}
                activeOpacity={0.8}
              >
                <Text style={styles.objectLabel}>{object.type}</Text>
                {isNearPlayer && !isCollected && (
                  <View style={styles.interactionHint}>
                    <Text style={styles.hintText}>Tap!</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Player */}
          <Animated.View
            style={[
              styles.player,
              {
                left: playerPosition.x,
                top: playerPosition.y,
                transform: [{ scale: playerAnim }]
              }
            ]}
          >
            <Ionicons name="person" size={32} color={theme.colors.base} />
          </Animated.View>

          {/* Movement Instructions */}
          {Platform.OS !== 'web' && (
            <View style={styles.mobileInstructions}>
              <Text style={styles.instructionText}>
                Drag to move • Tap objects to interact
              </Text>
            </View>
          )}
        </Animated.View>
      </PanGestureHandler>

      {/* Instructions Modal */}
      {showInstructions && (
        <View style={styles.instructionsModal}>
          <View style={styles.instructionsContent}>
            <Text style={styles.instructionsTitle}>🎮 How to Play</Text>
            <Text style={styles.instructionsText}>
              {Platform.OS === 'web' 
                ? '• Use arrow keys or drag to move your character\n• Click on colored objects to interact\n• Collect all items to complete the level!'
                : '• Drag anywhere to move your character\n• Tap on colored objects to interact\n• Collect all items to complete the level!'
              }
            </Text>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.startButtonText}>Start Exploring!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Completion Message */}
      {collectedItems.length === objects.length && objects.length > 0 && (
        <View style={styles.completionModal}>
          <View style={styles.completionContent}>
            <Text style={styles.completionTitle}>🎉 Level Complete!</Text>
            <Text style={styles.completionText}>
              You've discovered all {objects.length} learning opportunities!
            </Text>
            <Text style={styles.finalScore}>Final Score: {score} points</Text>
            <View style={styles.completionButtons}>
              <TouchableOpacity 
                style={styles.playAgainButton}
                onPress={resetGame}
              >
                <Text style={styles.playAgainText}>Play Again</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cardModeButton}
                onPress={() => router.push('/game-cards')}
              >
                <Text style={styles.cardModeText}>Try Card Mode</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.base,
  },
  headerSubtitle: {
    fontSize: 19,
    fontWeight: '500',
    color: theme.colors.base,
    opacity: 0.8,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreText: {
    color: theme.colors.base,
    fontSize: 14,
    fontWeight: '600',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    margin: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  gameObject: {
    position: 'absolute',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  objectLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.base,
    textAlign: 'center',
  },
  interactionHint: {
    position: 'absolute',
    top: -25,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hintText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  player: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  mobileInstructions: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 8,
  },
  instructionText: {
    color: theme.colors.base,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.base,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instructionsContent: {
    backgroundColor: theme.colors.base,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: theme.colors.base,
    fontSize: 18,
    fontWeight: '700',
  },
  completionModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completionContent: {
    backgroundColor: theme.colors.base,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  completionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  finalScore: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 24,
  },
  completionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  playAgainButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  playAgainText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '700',
  },
  cardModeButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  cardModeText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});