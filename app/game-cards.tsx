import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { useGameQuestions } from '@/hooks/useGameQuestions';
import { useStripe } from '@/hooks/useStripe';
import { useStats } from '@/hooks/useStats';
import { useElevenLabs } from '@/hooks/useElevenLabs';
import SubscriptionModal from '@/components/SubscriptionModal';
import NarratorButton from '@/components/NarratorButton';

const { width: screenWidth } = Dimensions.get('window');

// Game configuration
const POINTS_FOR_CORRECT = 10;
const POINTS_FOR_INCORRECT = -2;
const GAME_TIME_LIMIT = 300; // 5 minutes in seconds

export default function GameCardsScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { fetchQuestions, generateQuestions, saveGameSession, isLoading } = useGameQuestions();
  const { createStudySession, completeStudySession } = useStats();
  const { isSubscribed } = useStripe();
  const { speakText, isNarratorEnabled } = useElevenLabs();

  const subject = params.subject as string;
  const subtopic = params.subtopic as string; 
  const subtopicName = params.subtopicName as string;
  const topicId = params.topicId as string;
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameStats, setGameStats] = useState({
    points: 0,
    bonusPoints: 0,
    correct: 0,
    incorrect: 0,
    skipped: 0,
    timeSpent: 0,
  });
  
  const [timeRemaining, setTimeRemaining] = useState(GAME_TIME_LIMIT);
  const [studySession, setStudySession] = useState<any>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  
  // Timer interval reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load questions when component mounts
  useEffect(() => {
    loadQuestions();
    return () => {
      // Clean up timer on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start timer when game starts
  useEffect(() => {
    if (gameStarted && !gameEnded) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up, end the game
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStarted, gameEnded]);

  const loadQuestions = async () => {
    setLoadingQuestions(true);
    try {
      // First try to fetch existing questions
      let fetchedQuestions = await fetchQuestions(subject, subtopic);
      
      // If not enough questions, generate new ones
      if (fetchedQuestions.length < 10) {
        fetchedQuestions = await generateQuestions(subject, subtopic, user?.grade);
      }
      
      // Shuffle the questions
      const shuffled = [...fetchedQuestions].sort(() => Math.random() - 0.5);
      setQuestions(shuffled.slice(0, 10)); // Take 10 questions
    } catch (error) {
      console.error('Error loading questions:', error);
      Alert.alert(
        'Error Loading Questions',
        'There was a problem loading the questions. Please try again later.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setLoadingQuestions(false);
    }
  };

  const startGame = async () => {
    if (questions.length === 0) {
      Alert.alert('No Questions', 'No questions available for this topic yet.');
      return;
    }
    
    try {
      // Create a study session
      const session = await createStudySession(topicId, 'game');
      setStudySession(session);
      
      // Start the game
      setGameStarted(true);
      setCurrentQuestionIndex(0);
      setGameStats({
        points: 0,
        bonusPoints: 0,
        correct: 0,
        incorrect: 0,
        skipped: 0,
        timeSpent: 0,
      });
      setTimeRemaining(GAME_TIME_LIMIT);
    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert('Error', 'Failed to start game. Please try again.');
    }
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null || currentQuestionIndex >= questions.length) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correct_answer;
    
    // Calculate points and feedback message
    let feedbackMessage = '';
    const basePoints = isCorrect ? POINTS_FOR_CORRECT : POINTS_FOR_INCORRECT;
    if (isCorrect) {
      // Choose a random positive feedback message
      const positiveFeedbacks = [
        'Correct! You\'re on fire 🔥',
        'Excellent work! Keep it up! ✨',
        'Spot on! You\'re crushing it! 💪',
        'Perfect answer! Brilliant! 🌟',
        'That\'s right! You\'re a genius! 🧠',
        'Amazing! You\'ve got this! 👏',
        'Correct! You\'re unstoppable! 🚀',
        'Great job! Your knowledge is impressive! 📚',
        'Fantastic! You\'re making great progress! 📈'
      ];
      feedbackMessage = positiveFeedbacks[Math.floor(Math.random() * positiveFeedbacks.length)];
    } else {
      // Choose a random encouraging feedback message for incorrect answers
      const encouragingFeedbacks = [
        'Oops, try again…',
        'Not quite right, but keep going!',
        'Almost there! Next one you\'ll get it!',
        'Good try! Let\'s tackle the next one!',
        'That was tricky! Keep your focus!',
        'Don\'t worry, learning happens through mistakes!',
        'You\'ll get it next time!',
        'Keep going! Every attempt helps you learn!',
        'That\'s a challenging one! Let\'s continue!'
      ];
      feedbackMessage = encouragingFeedbacks[Math.floor(Math.random() * encouragingFeedbacks.length)];
    }
    const bonusPoints = isCorrect && isSubscribed ? POINTS_FOR_CORRECT : 0;
    const totalPoints = basePoints + bonusPoints;
    
    setSelectedAnswer(answer);
    setIsAnswerCorrect(isCorrect);
    
    // Speak feedback if narrator is enabled
    if (isNarratorEnabled) {
      speakText(feedbackMessage);
    }
    
    // Update game stats
    if (isCorrect && isSubscribed && !showSubscriptionModal) {
      setShowSubscriptionModal(Math.random() > 0.8); // Show subscription modal occasionally after correct answers
    }
    
    setGameStats(prev => ({
      ...prev,
      points: prev.points + (isCorrect ? POINTS_FOR_CORRECT : POINTS_FOR_INCORRECT),
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));
    
    // Animate feedback
    Animated.sequence([
      Animated.parallel([
        Animated.timing(cardScale, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(feedbackOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1000),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(feedbackOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Move to next question or end game
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setIsAnswerCorrect(null);
        
        // Reset animations
        cardScale.setValue(1);
        cardOpacity.setValue(1);
      } else {
        endGame();
      }
    });
  };

  // Speak question when it changes
  useEffect(() => {
    if (gameStarted && !gameEnded && currentQuestionIndex < questions.length && isNarratorEnabled) {
      // Add a 2-second delay before speaking the question
      const timer = setTimeout(() => {
        const currentQuestion = questions[currentQuestionIndex];
        speakText(currentQuestion.question);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, gameStarted, questions, isNarratorEnabled]);

  const skipQuestion = () => {
    if (selectedAnswer !== null || currentQuestionIndex >= questions.length) return;
    
    // Update game stats
    setGameStats(prev => ({
      ...prev,
      skipped: prev.skipped + 1,
    }));
    
    // Animate card exit
    Animated.timing(cardOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Move to next question or end game
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        
        // Reset animations
        cardOpacity.setValue(1);
      } else {
        endGame();
      }
    });
  };

  const endGame = async () => {
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setGameEnded(true);
    
    try {
      // Calculate time spent
      const timeSpent = GAME_TIME_LIMIT - timeRemaining;
      
      // Update game stats with time spent
      setGameStats(prev => ({
        ...prev,
        timeSpent,
      }));
      
      // Save game session
      await saveGameSession({
        subject,
        topic: subtopic, 
        points_earned: gameStats.points,
        questions_attempted: gameStats.correct + gameStats.incorrect + gameStats.skipped,
        questions_correct: gameStats.correct,
        questions_wrong: gameStats.incorrect,
        duration_seconds: timeSpent,
      });
      
      // Complete the study session
      if (studySession) {
        await completeStudySession(
          studySession.id, 
          Math.ceil(timeSpent / 60), // Convert seconds to minutes
          gameStats.points
        );
      }
    } catch (error) {
      console.error('Error saving game results:', error);
    }
  };

  const restartGame = () => {
    setGameStarted(false);
    setGameEnded(false);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setCurrentQuestionIndex(0);
    
    // Reset animations
    cardScale.setValue(1);
    cardOpacity.setValue(1);
    feedbackOpacity.setValue(0);
    
    // Shuffle questions
    setQuestions(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const renderMultipleChoiceQuestion = (question: any) => (
    <View style={styles.questionContent}>
      <Text style={styles.questionText}>{question.question}</Text>
      <View style={styles.optionsContainer}>
        {question.options.map((option: any) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionButton,
              selectedAnswer === option.id && (
                isAnswerCorrect ? styles.correctOption : styles.incorrectOption
              ),
              selectedAnswer && 
              selectedAnswer !== option.id && 
              option.id === question.correct_answer && 
              styles.correctOption
            ]}
            onPress={() => handleAnswer(option.id)}
            disabled={selectedAnswer !== null}
            activeOpacity={0.8}
          >
            <View style={styles.optionLabel}>
              <Text style={styles.optionLabelText}>{option.id}</Text>
              {isNarratorEnabled && (
                <Ionicons name="volume-high" size={16} color={theme.colors.primary} style={styles.narratorIcon} />
              )}
            </View>
            <Text style={styles.optionText}>{option.text}</Text>
            {selectedAnswer === option.id && isAnswerCorrect && (
              <Ionicons name="checkmark-circle" size={24} color="#10B981" style={styles.feedbackIcon} />
            )}
            {selectedAnswer === option.id && !isAnswerCorrect && (
              <Ionicons name="close-circle" size={24} color="#EF4444" style={styles.feedbackIcon} />
            )}
            {selectedAnswer !== null && 
             selectedAnswer !== option.id && 
             option.id === question.correct_answer && (
              <Ionicons name="checkmark-circle" size={24} color="#10B981" style={styles.feedbackIcon} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTrueFalseQuestion = (question: any) => (
    <View style={styles.questionContent}>
      <Text style={styles.questionText}>{question.question}</Text>
      <View style={styles.trueFalseContainer}>
        <TouchableOpacity
          style={[
            styles.trueFalseButton,
            selectedAnswer === 'True' && (
              isAnswerCorrect ? styles.correctOption : styles.incorrectOption
            ),
            selectedAnswer && 
            selectedAnswer !== 'True' && 
            'True' === question.correct_answer && 
            styles.correctOption
          ]}
          onPress={() => handleAnswer('True')}
          disabled={selectedAnswer !== null}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={32} color={theme.colors.base} />
          <Text style={styles.trueFalseText}>True</Text>
          {selectedAnswer === 'True' && isAnswerCorrect && (
            <Ionicons name="checkmark-circle" size={24} color="#10B981" style={styles.feedbackIcon} />
          )}
          {selectedAnswer === 'True' && !isAnswerCorrect && (
            <Ionicons name="close-circle" size={24} color="#EF4444" style={styles.feedbackIcon} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.trueFalseButton,
            selectedAnswer === 'False' && (
              isAnswerCorrect ? styles.correctOption : styles.incorrectOption
            ),
            selectedAnswer && 
            selectedAnswer !== 'False' && 
            'False' === question.correct_answer && 
            styles.correctOption
          ]}
          onPress={() => handleAnswer('False')}
          disabled={selectedAnswer !== null}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={32} color={theme.colors.base} />
          <Text style={styles.trueFalseText}>False</Text>
          {selectedAnswer === 'False' && isAnswerCorrect && (
            <Ionicons name="checkmark-circle" size={24} color="#10B981" style={styles.feedbackIcon} />
          )}
          {selectedAnswer === 'False' && !isAnswerCorrect && (
            <Ionicons name="close-circle" size={24} color="#EF4444" style={styles.feedbackIcon} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGameCard = () => {
    if (currentQuestionIndex >= questions.length) return null;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <Animated.View 
        style={[
          styles.gameCard,
          { 
            transform: [{ scale: cardScale }],
            opacity: cardOpacity
          }
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.questionTypeTag}>
            <Ionicons 
              name={currentQuestion.type === 'multiple_choice' ? 'list' : 'checkmark-circle'} 
              size={16} 
              color={theme.colors.base} 
            />
            <NarratorButton position="top-left" size={30} />
            <Text style={styles.questionTypeText}>
              {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'}
            </Text>
          </View>
          <Text style={styles.questionCounter}>
            {currentQuestionIndex + 1}/{questions.length}
          </Text>
        </View>
        
        {currentQuestion.type === 'multiple_choice' 
          ? renderMultipleChoiceQuestion(currentQuestion)
          : renderTrueFalseQuestion(currentQuestion)
        }
        
        <TouchableOpacity
          style={styles.skipButton}
          onPress={skipQuestion}
          disabled={selectedAnswer !== null}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
          <Ionicons name="arrow-forward" size={16} color={theme.colors.secondary} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderFeedback = () => {
    if (isAnswerCorrect === null || currentQuestionIndex >= questions.length) return null;
    
    return (
      <Animated.View 
        style={[
          styles.feedbackContainer,
          { opacity: feedbackOpacity }
        ]}
      >
        <View style={[
          styles.feedbackContent,
          isAnswerCorrect ? styles.correctFeedback : styles.incorrectFeedback
        ]}>
          <Ionicons 
            name={isAnswerCorrect ? 'checkmark-circle' : 'close-circle'} 
            size={48} 
            color={isAnswerCorrect ? '#10B981' : '#EF4444'} 
          />
          <Text style={styles.feedbackText}>
            {isAnswerCorrect ? 'Correct!' : 'Incorrect!'}
          </Text>
          <Text style={styles.pointsText}>
            {isAnswerCorrect ? `+${POINTS_FOR_CORRECT}` : POINTS_FOR_INCORRECT} points
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderGameStats = () => (
    <View style={styles.gameStatsContainer}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="bulb" size={20} color={theme.colors.accent} />
          <Text style={styles.statValue}>
            {gameStats.points}
            {isSubscribed && gameStats.bonusPoints > 0 && (
              <Text style={styles.bonusPointsText}> +{gameStats.bonusPoints}</Text>
            )}
          </Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.statValue}>{gameStats.correct}</Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="close-circle" size={20} color="#EF4444" />
          <Text style={styles.statValue}>{gameStats.incorrect}</Text>
          <Text style={styles.statLabel}>Incorrect</Text>
        </View>
      </View>
      
      <View style={styles.timerContainer}>
        <Ionicons name="time" size={20} color={theme.colors.primary} />
        <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
      </View>
    </View>
  );

  const renderGameOver = () => (
    <View style={styles.gameOverContainer}>
      <View style={styles.gameOverHeader}>
        <Ionicons 
          name={gameStats.points > 0 ? "trophy" : "sad"} 
          size={64} 
          color={gameStats.points > 0 ? theme.colors.accent : theme.colors.secondary} 
        />
        <Text style={styles.gameOverTitle}>Game Complete!</Text>
      </View>
      
      <View style={styles.resultsContainer}>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Total Points:</Text>
          <Text style={styles.resultValue}>{gameStats.points}</Text>
        </View>
        
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Correct Answers:</Text>
          <Text style={styles.resultValue}>{gameStats.correct}</Text>
        </View>
        
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Incorrect Answers:</Text>
          <Text style={styles.resultValue}>{gameStats.incorrect}</Text>
        </View>
        
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Skipped Questions:</Text>
          <Text style={styles.resultValue}>{gameStats.skipped}</Text>
        </View>
        
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Time Spent:</Text>
          <Text style={styles.resultValue}>{formatTime(gameStats.timeSpent)}</Text>
        </View>
        
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Accuracy:</Text>
          <Text style={styles.resultValue}>
            {gameStats.correct + gameStats.incorrect > 0
              ? `${Math.round((gameStats.correct / (gameStats.correct + gameStats.incorrect)) * 100)}%`
              : '0%'}
          </Text>
        </View>
      </View>
      
      <View style={styles.gameOverActions}>
        <TouchableOpacity
          style={styles.playAgainButton}
          onPress={restartGame}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={20} color={theme.colors.base} />
          <Text style={styles.playAgainButtonText}>Play Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.backToMapButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="map" size={20} color={theme.colors.primary} />
          <Text style={styles.backToMapButtonText}>Back to Map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStartScreen = () => (
    <View style={styles.startScreenContainer}>
      <View style={styles.startScreenHeader}>
        <Ionicons name="game-controller" size={64} color={theme.colors.primary} />
        <Text style={styles.startScreenTitle}>{subtopicName}</Text>
        <Text style={styles.startScreenSubtitle}>Interactive Learning Game</Text>
      </View>
      
      <View style={styles.gameInfoContainer}>
        <Text style={styles.gameInfoTitle}>Game Rules:</Text>
        
        <View style={styles.gameInfoItem}>
          <Ionicons name="list" size={20} color={theme.colors.primary} />
          <Text style={styles.gameInfoText}>
            Answer multiple choice and true/false questions
          </Text>
        </View>
        
        <View style={styles.gameInfoItem}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.gameInfoText}>
            Correct answers: +{POINTS_FOR_CORRECT} points
          </Text>
        </View>
        
        <View style={styles.gameInfoItem}>
          <Ionicons name="close-circle" size={20} color="#EF4444" />
          <Text style={styles.gameInfoText}>
            Incorrect answers: {POINTS_FOR_INCORRECT} points
          </Text>
        </View>
        
        <View style={styles.gameInfoItem}>
          <Ionicons name="time" size={20} color={theme.colors.secondary} />
          <Text style={styles.gameInfoText}>
            Time limit: {Math.floor(GAME_TIME_LIMIT / 60)} minutes
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.startButton}
        onPress={startGame}
        disabled={loadingQuestions || questions.length === 0}
        activeOpacity={0.8}
      >
        {loadingQuestions ? (
          <ActivityIndicator size="small" color={theme.colors.base} />
        ) : (
          <>
            <Ionicons name="play" size={20} color={theme.colors.base} />
            <Text style={styles.startButtonText}>Start Game</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (gameStarted && !gameEnded) {
              Alert.alert(
                'Quit Game',
                'Are you sure you want to quit? Your progress will be lost.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Quit', style: 'destructive', onPress: () => router.back() }
                ]
              );
            } else {
              router.back();
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {gameStarted ? 'Game in Progress' : subtopicName}
          </Text>
          <Text style={styles.headerSubtitle}>{subject}</Text>
        </View>
        
        <View style={styles.headerRight}>
          {gameStarted && !gameEnded && (
            <TouchableOpacity
              style={styles.endGameButton}
              onPress={() => {
                Alert.alert(
                  'End Game',
                  'Are you sure you want to end the game?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'End Game', style: 'destructive', onPress: endGame }
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="flag" size={20} color={theme.colors.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Game Content */}
      <View style={styles.content}>
        {!gameStarted && !gameEnded && renderStartScreen()}
        
        {gameStarted && !gameEnded && (
          <>
            {renderGameStats()}
            {renderGameCard()}
            {renderFeedback()}
          </>
        )}
        
        {gameEnded && renderGameOver()}
      </View>
      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        context="battle"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.surfaceLight}80`,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
    opacity: 0.8,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  endGameButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  // Start Screen Styles
  startScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  startScreenHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  startScreenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.secondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  startScreenSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  gameInfoContainer: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 32,
  },
  gameInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 16,
  },
  gameInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  gameInfoText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    flex: 1,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.base,
  },
  // Game Stats Styles
  gameStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    margin: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  bonusPointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary, 
  },
  narratorIcon: {
    marginLeft: 4,
  },
  // Game Card Styles
  gameCard: {
    backgroundColor: theme.colors.base,
    borderRadius: 20,
    padding: 20,
    margin: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}20`,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  questionTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.base,
  },
  questionCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  questionContent: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.secondary,
    lineHeight: 26,
    marginBottom: 20,
  },
  // Multiple Choice Styles
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  correctOption: {
    backgroundColor: `${theme.colors.success}15`,
    borderColor: theme.colors.success,
  },
  incorrectOption: {
    backgroundColor: `${theme.colors.error}15`,
    borderColor: theme.colors.error,
  },
  optionLabel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${theme.colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    flex: 1,
  },
  feedbackIcon: {
    marginLeft: 8,
  },
  // True/False Styles
  trueFalseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  trueFalseButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 20,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  trueFalseText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.base,
  },
  // Skip Button
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  // Feedback Styles
  feedbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  feedbackContent: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.base,
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  correctFeedback: {
    borderWidth: 3,
    borderColor: theme.colors.success,
  },
  incorrectFeedback: {
    borderWidth: 3,
    borderColor: theme.colors.error,
  },
  feedbackText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginTop: 12,
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  // Game Over Styles
  gameOverContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  gameOverHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginTop: 16,
  },
  resultsContainer: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 32,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.primary}10`,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  gameOverActions: {
    width: '100%',
    gap: 12,
  },
  playAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  playAgainButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.base,
  },
  backToMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  backToMapButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});