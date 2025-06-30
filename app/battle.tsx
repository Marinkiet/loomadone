import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { useGameQuestions } from '@/hooks/useGameQuestions';
import { useStripe } from '@/hooks/useStripe';
import { useElevenLabs } from '@/hooks/useElevenLabs';
import { supabase } from '@/lib/supabase';
import NarratorButton from '@/components/NarratorButton';

// Mock friends data (same as in QuickBattleModal)
const mockFriends = [
  {
    id: '1',
    name: 'Alex Chen',
    username: 'alex_chen',
    profileImage: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop',
    level: 'Grade 11',
    points: 2847,
    online: true
  },
  {
    id: '2',
    name: 'Maya Patel',
    username: 'maya_patel',
    profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop',
    level: 'Grade 12',
    points: 3156,
    online: true
  },
  {
    id: '3',
    name: 'Jordan Smith',
    username: 'jordan_smith',
    profileImage: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop',
    level: 'Grade 10',
    points: 2234,
    online: false
  },
  {
    id: '4',
    name: 'Zara Ahmed',
    username: 'zara_ahmed',
    profileImage: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop',
    level: 'Grade 11',
    points: 2945,
    online: false
  },
  {
    id: '5',
    name: 'Leo Garcia',
    username: 'leo_garcia',
    profileImage: 'https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop',
    level: 'Grade 12',
    points: 3421,
    online: true
  }
];

// Battle states
type BattleState = 'loading' | 'countdown' | 'question' | 'result' | 'summary';

export default function BattleScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { fetchQuestions, saveGameSession } = useGameQuestions();
  const { isSubscribed } = useStripe();
  const { speakText, isNarratorEnabled } = useElevenLabs();
  
  const opponentId = params.opponentId as string;
  const subject = params.subject as string; 
  
  const [battleState, setBattleState] = useState<BattleState>('loading');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [timeRemaining, setTimeRemaining] = useState(15); // 15 seconds per question
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerCorrect, setPlayerCorrect] = useState(0);
  const [opponentCorrect, setOpponentCorrect] = useState(0);
  const [superCellsEarned, setSuperCellsEarned] = useState(0);
  
  const countdownAnim = useRef(new Animated.Value(1)).current;
  const questionAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;
  
  // Get opponent data
  const opponent = mockFriends.find(f => f.id === opponentId);
  
  // Timer refs
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load questions and start battle
  useEffect(() => {
    loadQuestions();
    
    return () => {
      // Clean up timers
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, []);
  
  // Countdown timer
  useEffect(() => {
    if (battleState === 'countdown') {
      countdownTimerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current!);
            setBattleState('question');
            startQuestionTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Animate countdown
      Animated.loop(
        Animated.sequence([
          Animated.timing(countdownAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(countdownAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [battleState]);
  
  // Question timer
  useEffect(() => {
    if (battleState === 'question') {
      // Animate question in
      Animated.timing(questionAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [battleState, currentQuestionIndex]);
  
  // Speak question when it changes
  useEffect(() => {
    if (battleState === 'question' && currentQuestionIndex < questions.length && isNarratorEnabled) {
      // Add a 2-second delay before speaking the question
      const timer = setTimeout(() => {
        const currentQuestion = questions[currentQuestionIndex];
        speakText(currentQuestion.question);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, battleState, questions, isNarratorEnabled]);
  
  // Result animation
  useEffect(() => {
    if (battleState === 'result') {
      // Animate result in
      Animated.timing(resultAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Auto-proceed to next question after 2 seconds
      const timer = setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          // Move to next question
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedAnswer(null);
          setIsAnswerCorrect(null);
          setBattleState('question');
          setTimeRemaining(15);
          
          // Reset animations
          questionAnim.setValue(0);
          resultAnim.setValue(0);
          
          // Start question timer
          startQuestionTimer();
        } else {
          // End of battle
          setBattleState('summary');
          saveBattleResults();
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [battleState]);
  
  const loadQuestions = async () => {
    try {
      // Fetch questions for the selected subject
      const fetchedQuestions = await fetchQuestions(subject, 'quick-battle');
      
      // If not enough questions, use default ones
      if (fetchedQuestions.length < 5) {
        // Create some default questions
        const defaultQuestions = [
          {
            id: '1',
            question: 'What is the capital of France?',
            options: [
              { id: 'A', text: 'London' },
              { id: 'B', text: 'Paris' },
              { id: 'C', text: 'Berlin' },
              { id: 'D', text: 'Madrid' }
            ],
            correct_answer: 'B',
            type: 'multiple_choice'
          },
          {
            id: '2',
            question: 'Water boils at 100 degrees Celsius at sea level.',
            correct_answer: 'True',
            type: 'true_false'
          },
          {
            id: '3',
            question: 'Which planet is known as the Red Planet?',
            options: [
              { id: 'A', text: 'Venus' },
              { id: 'B', text: 'Mars' },
              { id: 'C', text: 'Jupiter' },
              { id: 'D', text: 'Saturn' }
            ],
            correct_answer: 'B',
            type: 'multiple_choice'
          },
          {
            id: '4',
            question: 'The Great Wall of China is visible from space with the naked eye.',
            correct_answer: 'False',
            type: 'true_false'
          },
          {
            id: '5',
            question: 'Which of these is not a primary color?',
            options: [
              { id: 'A', text: 'Red' },
              { id: 'B', text: 'Blue' },
              { id: 'C', text: 'Green' },
              { id: 'D', text: 'Yellow' }
            ],
            correct_answer: 'D',
            type: 'multiple_choice'
          }
        ];
        
        setQuestions(defaultQuestions);
      } else {
        // Use fetched questions (limit to 5)
        setQuestions(fetchedQuestions.slice(0, 5));
      }
      
      // Start countdown
      setBattleState('countdown');
    } catch (error) {
      console.error('Error loading questions:', error);
      Alert.alert(
        'Error',
        'Failed to load battle questions. Please try again.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };
  
  const startQuestionTimer = () => {
    // Clear any existing timer
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    
    // Start new timer
    questionTimerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(questionTimerRef.current!);
          
          // Time's up, simulate opponent answer and show result
          const isOpponentCorrect = Math.random() > 0.5; // 50% chance
          
          if (isOpponentCorrect) {
            setOpponentScore(prev => prev + 10);
            setOpponentCorrect(prev => prev + 1);
          }
          
          // If player hasn't answered, count as wrong
          if (selectedAnswer === null) {
            setSelectedAnswer('timeout');
            setIsAnswerCorrect(false);
          }
          
          setBattleState('result');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const handleAnswer = (answer: string) => {
    // Ignore if already answered
    if (selectedAnswer !== null) return;
    
    // Stop timer
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correct_answer;
    
    // Update player score
    let feedbackMessage = '';
    if (isCorrect) {
      const points = 10;
      const bonusPoints = isSubscribed ? 10 : 0;
      const totalPoints = points + bonusPoints;
      
      // Choose a random positive feedback message
      const positiveFeedbacks = [
        'Correct! You\'re on fire 🔥',
        'Excellent work! Keep it up! ✨',
        'Spot on! You\'re crushing it! 💪',
        'Perfect answer! Brilliant! 🌟',
        'That\'s right! You\'re a genius! 🧠',
        'Amazing! You\'ve got this! 👏',
        'Correct! You\'re unstoppable! 🚀'
      ];
      feedbackMessage = positiveFeedbacks[Math.floor(Math.random() * positiveFeedbacks.length)];
      setPlayerScore(prev => prev + totalPoints);
      setPlayerCorrect(prev => prev + 1);
      setSuperCellsEarned(prev => prev + totalPoints);
    } else {
      // Choose a random encouraging feedback message for incorrect answers
      const encouragingFeedbacks = [
        'Oops, try again…',
        'Not quite right, but keep going!',
        'Almost there! Next one you\'ll get it!',
        'Good try! Let\'s tackle the next one!',
        'That was tricky! Keep your focus!',
        'Don\'t worry, learning happens through mistakes!',
        'You\'ll get it next time!'
      ];
      feedbackMessage = encouragingFeedbacks[Math.floor(Math.random() * encouragingFeedbacks.length)];
    }
    
    // Simulate opponent answer
    const isOpponentCorrect = Math.random() > 0.4; // 60% chance
    
    if (isOpponentCorrect) {
      setOpponentScore(prev => prev + 10);
      setOpponentCorrect(prev => prev + 1);
    }
    
    // Update state
    setSelectedAnswer(answer);
    setIsAnswerCorrect(isCorrect);
    setBattleState('result');
    
    // Speak feedback if narrator is enabled
    if (isNarratorEnabled) {
      speakText(feedbackMessage);
    }
  };
  
  const saveBattleResults = async () => {
    try {
      // Save game session
      await saveGameSession({
        subject,
        topic: 'quick-battle',
        points_earned: superCellsEarned,
        questions_attempted: questions.length,
        questions_correct: playerCorrect,
        questions_wrong: questions.length - playerCorrect,
        duration_seconds: questions.length * 15,
      });
      
      // Save battle record to database (in a real app)
      console.log('Battle results saved:', {
        player: user?.id,
        opponent: opponentId,
        playerScore,
        opponentScore,
        playerCorrect,
        opponentCorrect,
        subject,
        superCellsEarned,
        winner: playerScore > opponentScore ? user?.id : opponentId
      });
      
      // Update user's Looma Cells
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ 
            looma_cells: (user.looma_cells || 0) + superCellsEarned 
          })
          .eq('id', user.id);
          
        if (error) {
          console.error('Error updating user Looma Cells:', error);
        }
      }
    } catch (error) {
      console.error('Error saving battle results:', error);
    }
  };
  
  const handlePlayAgain = () => {
    // Reset state
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    setPlayerScore(0);
    setOpponentScore(0);
    setPlayerCorrect(0);
    setOpponentCorrect(0);
    setSuperCellsEarned(0);
    setTimeRemaining(15);
    
    // Reset animations
    questionAnim.setValue(0);
    resultAnim.setValue(0);
    
    // Start new battle
    setBattleState('countdown');
    setCountdown(3);
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
  
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>Preparing Battle...</Text>
    </View>
  );
  
  const renderCountdown = () => (
    <View style={styles.countdownContainer}>
      <Text style={styles.countdownTitle}>Battle Starting</Text>
      <Animated.Text 
        style={[
          styles.countdownNumber,
          { transform: [{ scale: countdownAnim }] }
        ]}
      >
        {countdown}
      </Animated.Text>
      <Text style={styles.countdownSubtext}>Get ready!</Text>
    </View>
  );
  
  const renderQuestion = () => {
    if (currentQuestionIndex >= questions.length) return null;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <Animated.View 
        style={[
          styles.questionContainer,
          { opacity: questionAnim }
        ]}
      >

        <View style={styles.questionHeader}>
 
  <View style={styles.questionCounter}>
    <Text style={styles.questionCounterText}>
      <NarratorButton size={25}  position='absolute' style={styles.narratorButton} />
      Question {currentQuestionIndex + 1}/{questions.length}
     
    </Text>
      
  </View>


                

  
          
          <View style={styles.timerContainer}>
            <Ionicons name="time" size={16} color={timeRemaining <= 5 ? theme.colors.error : theme.colors.primary} />
            <Text style={[
              styles.timerText, 
              timeRemaining <= 5 && styles.timerTextLow
            ]}>
              {timeRemaining}s
            </Text>
            {isNarratorEnabled && (
              <Ionicons name="volume-high" size={16} color={theme.colors.primary} style={styles.narratorIcon} />
              
            )}
            
          </View>
         
           
        </View>
        
        
        {currentQuestion.type === 'multiple_choice' 
          ? renderMultipleChoiceQuestion(currentQuestion)
          : renderTrueFalseQuestion(currentQuestion)
        }
       
      </Animated.View>
      
    );
    
  };
  
  const renderResult = () => {
    const resultMessage = isAnswerCorrect 
      ? 'Correct!' 
      : selectedAnswer === 'timeout' 
        ? 'Time\'s Up!' 
        : 'Incorrect!';
        
    const resultIcon = isAnswerCorrect 
      ? 'checkmark-circle' 
      : selectedAnswer === 'timeout' 
        ? 'time' 
        : 'close-circle';
        
    const resultColor = isAnswerCorrect 
      ? theme.colors.success 
      : selectedAnswer === 'timeout' 
        ? theme.colors.warning 
        : theme.colors.error;
    
    return (
      
      <Animated.View 
        style={[
          styles.resultContainer,
          { opacity: resultAnim }
        ]}
      >
        
        <View style={[styles.resultContent, { borderColor: resultColor }]}>
          <Ionicons name={resultIcon as any} size={48} color={resultColor} />
          <Text style={[styles.resultText, { color: resultColor }]}>
            {resultMessage}
          </Text>
          
          {isAnswerCorrect && (
            <View style={styles.pointsEarned}>
              <Text style={styles.pointsEarnedText}>
                +{isSubscribed ? '20' : '10'} Looma Cells
              </Text>
              {isSubscribed && (
                <View style={styles.bonusBadge}>
                  <Text style={styles.bonusBadgeText}>2x</Text>
                </View>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.scoreUpdate}>
          <View style={styles.playerScoreContainer}>
            <Text style={styles.playerScoreName}>{user?.full_name?.split(' ')[0] || 'You'}</Text>
            <Text style={styles.playerScoreValue}>{playerScore}</Text>
          </View>
          
          <View style={styles.scoreVs}>
            <Text style={styles.scoreVsText}>vs</Text>
          </View>
          
          
          <View style={styles.playerScoreContainer}>
            <Text style={styles.playerScoreName}>{opponent?.name.split(' ')[0]}</Text>
            <Text style={styles.playerScoreValue}>{opponentScore}</Text>
          </View>
        </View>
         
      </Animated.View>
    );
  };
  
  const renderSummary = () => {
    const playerWon = playerScore > opponentScore;
    const isTie = playerScore === opponentScore;
    
    return (
      <ScrollView style={styles.summaryContainer}>
        
        <View style={styles.summaryHeader}>
          <Ionicons 
            name={playerWon ? "trophy" : isTie ? "medal" : "sad"} 
            size={64} 
            color={playerWon ? '#FFD700' : isTie ? theme.colors.primary : theme.colors.secondary} 
          />
          <Text style={styles.summaryTitle}>
            {playerWon ? 'Victory!' : isTie ? 'It\'s a Tie!' : 'Defeat!'}
          </Text>
          <Text style={styles.summarySubtitle}>
            {playerWon 
              ? 'Congratulations on your win!' 
              : isTie 
                ? 'Great effort from both sides!' 
                : 'Better luck next time!'}
          </Text>
        </View>
        
        <View style={styles.battleSummary}>
          <View style={styles.summaryScores}>
            <View style={styles.summaryPlayerScore}>
              <Image 
                source={{ uri: user?.profile_image || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop' }}
                style={styles.summaryPlayerImage}
              />
              <Text style={styles.summaryPlayerName}>{user?.full_name?.split(' ')[0] || 'You'}</Text>
              <Text style={styles.summaryScoreValue}>{playerScore}</Text>
              <Text style={styles.summaryCorrectCount}>{playerCorrect}/{questions.length} correct</Text>
            </View>
            
            <View style={styles.summaryVs}>
              <Text style={styles.summaryVsText}>VS</Text>
            </View>
            
            <View style={styles.summaryPlayerScore}>
              <Image 
                source={{ uri: opponent?.profileImage }}
                style={styles.summaryPlayerImage}
              />
              <Text style={styles.summaryPlayerName}>{opponent?.name.split(' ')[0]}</Text>
              <Text style={styles.summaryScoreValue}>{opponentScore}</Text>
              <Text style={styles.summaryCorrectCount}>{opponentCorrect}/{questions.length} correct</Text>
            </View>
          </View>
          
          <View style={styles.rewardSummary}>
            <Text style={styles.rewardTitle}>Battle Rewards</Text>
            <View style={styles.rewardItem}>
              <Ionicons name="bulb" size={20} color={theme.colors.accent} />
              <Text style={styles.rewardText}>
                {superCellsEarned} Looma Cells Earned
                {isSubscribed && ' (2x Bonus)'}
              </Text>
            </View>
            {playerWon && (
              <View style={styles.rewardItem}>
                <Ionicons name="trophy" size={20} color="#FFD700" />
                <Text style={styles.rewardText}>Victory Bonus: +5 Looma Cells</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.summaryActions}>
          <TouchableOpacity
            style={styles.playAgainButton}
            onPress={handlePlayAgain}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color={theme.colors.base} />
            <Text style={styles.playAgainButtonText}>Play Again</Text>
          </TouchableOpacity>
          
         
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="home" size={20} color={theme.colors.primary} />
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (battleState !== 'summary') {
              Alert.alert(
                'Quit Battle',
                'Are you sure you want to quit? You will lose any progress.',
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
        
        <Text style={styles.headerTitle}>
          Quick Battle: {subject}
        </Text>
        
        <View style={styles.headerRight} />
      </View>
      
      {/* Battle Arena */}
      <View style={styles.battleArena}>
        {/* Player Avatars */}
        <View style={styles.playersContainer}>
          {/* Player 1 */}
          <View style={styles.playerInfo}>
            <Image 
              source={{ uri: user?.profile_image || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop' }}
              style={styles.playerAvatar}
            />
            <Text style={styles.playerName}>{user?.full_name?.split(' ')[0] || 'You'}</Text>
            <View style={styles.playerScore}>
              <Text style={styles.scoreText}>{playerScore}</Text>
            </View>
          </View>
          
          {/* VS */}
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          
          
          {/* Player 2 (Opponent) */}
          <View style={styles.playerInfo}>
            <Image 
              source={{ uri: opponent?.profileImage }}
              style={styles.playerAvatar}
            />
            <Text style={styles.playerName}>{opponent?.name.split(' ')[0]}</Text>
            <View style={styles.playerScore}>
              <Text style={styles.scoreText}>{opponentScore}</Text>
            </View>
          </View>
        </View>
        
        {/* Battle Content */}
        <View style={styles.battleContent}>
          {battleState === 'loading' && renderLoading()}
          {battleState === 'countdown' && renderCountdown()}
          {battleState === 'question' && renderQuestion()}
          {battleState === 'result' && renderResult()}
          {battleState === 'summary' && renderSummary()}
        </View>
      </View>
      
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
  headerTitle: {
    flexShrink: 1,
    fontSize: 14,
     flexGrow: 0, 
    flexBasis: '70%',
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  headerRight: {
    width: 40,
  },
  battleArena: {
    flex: 1,
    padding: 16,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  playerInfo: {
    alignItems: 'center',
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  playerScore: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.base,
  },
  vsContainer: {
    backgroundColor: `${theme.colors.primary}20`,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  vsText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  battleContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Loading State
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginTop: 16,
  },
  // Countdown State
  countdownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 16,
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  countdownSubtext: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  // Question State
  questionContainer: {
    width: '100%',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionCounter: {
    backgroundColor: `${theme.colors.primary}20`,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,

  },
  narratorButton: {
},
  questionCounterText: {
    fontSize: 14,
    fontWeight: '600',
   
    color: theme.colors.primary,

  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: 12, 
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  timerTextLow: {
    color: theme.colors.error,
  },
  narratorIcon: {
    marginLeft: 4,
  },
  questionContent: {
    marginBottom: 16,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 20,
    lineHeight: 24,
  },
  // Multiple Choice Styles
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.base,
    borderRadius: 12,
    padding: 12,
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
    padding: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  trueFalseText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.base,
  },
  // Result State
  resultContainer: {
    width: '100%',
    alignItems: 'center',
  },
  resultContent: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.base,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 3,
    width: '100%',
  },
  resultText: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  pointsEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsEarnedText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  bonusBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bonusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  scoreUpdate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  playerScoreContainer: {
    alignItems: 'center',
    flex: 1,
  },
  playerScoreName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  playerScoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  scoreVs: {
    paddingHorizontal: 16,
  },
  scoreVsText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  // Summary State
  summaryContainer: {
    width: '100%',
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginTop: 8,
    marginBottom: 8,
  },
  summarySubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    textAlign: 'center',
  },
  battleSummary: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  summaryScores: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryPlayerScore: {
    alignItems: 'center',
    flex: 1,
  },
  summaryPlayerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    marginBottom: 8,
  },
  summaryPlayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  summaryScoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  summaryCorrectCount: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  summaryVs: {
    paddingHorizontal: 16,
  },
  summaryVsText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  rewardSummary: {
    borderTopWidth: 1,
    borderTopColor: `${theme.colors.primary}20`,
    paddingTop: 16,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  summaryActions: {
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
  homeButton: {
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
  homeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});