import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Image,
  Alert,
  ScrollView,
  Modal,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { theme } from '@/theme';
import { WeeklyProgressGraph } from '@/components';
import { useAuth } from '@/hooks/useAuth';
import QuickBattleModal from '@/components/QuickBattleModal';
import { useStripe } from '@/hooks/useStripe';
import { useStats } from '@/hooks/useStats';
import { useTimetable } from '@/hooks/useTimetable';
import { useGameQuestions } from '@/hooks/useGameQuestions';
import SubscriptionModal from '@/components/SubscriptionModal';
import { supabase } from '@/lib/supabase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Subject icon and color mapping
const getSubjectIcon = (subject: string) => {
  const iconMap: { [key: string]: string } = {
    'English Home Language': 'book',
    'Afrikaans First Additional Language': 'language',
    'Mathematics': 'calculator',
    'Mathematical Literacy': 'stats-chart',
    'Natural Sciences': 'flask',
    'Physical Sciences': 'planet',
    'Life Sciences': 'leaf',
    'Social Sciences': 'globe',
    'Geography': 'earth',
    'History': 'library',
    'Economic and Management Sciences': 'briefcase',
    'Business Studies': 'briefcase',
    'Economics': 'trending-up',
    'Accounting': 'calculator',
    'Technology': 'construct',
    'Computer Applications Technology': 'desktop',
    'Information Technology': 'hardware-chip',
    'Life Orientation': 'compass',
    'Creative Arts': 'color-palette',
    'Visual Arts': 'brush',
    'Dramatic Arts': 'musical-notes',
    'Tourism': 'airplane',
    'Engineering Graphics and Design': 'construct',
    'Agricultural Sciences': 'leaf',
    'Consumer Studies': 'home',
    'IsiZulu First Additional Language': 'language',
    'IsiXhosa First Additional Language': 'language',
  };
  return iconMap[subject] || 'book';
};

const getSubjectColor = (subject: string) => {
  const colorMap: { [key: string]: string } = {
    'English Home Language': '#3B82F6',
    'Afrikaans First Additional Language': '#F59E0B',
    'Mathematics': '#8B5CF6',
    'Mathematical Literacy': '#7C3AED',
    'Natural Sciences': '#10B981',
    'Physical Sciences': '#F59E0B',
    'Life Sciences': '#10B981',
    'Social Sciences': '#6366F1',
    'Geography': '#059669',
    'History': '#6366F1',
    'Economic and Management Sciences': '#059669',
    'Business Studies': '#059669',
    'Economics': '#0891B2',
    'Accounting': '#EF4444',
    'Technology': '#0891B2',
    'Computer Applications Technology': '#0891B2',
    'Information Technology': '#7C3AED',
    'Life Orientation': '#DC2626',
    'Creative Arts': '#EC4899',
    'Visual Arts': '#EC4899',
    'Dramatic Arts': '#F59E0B',
    'Tourism': '#10B981',
    'Engineering Graphics and Design': '#6366F1',
    'Agricultural Sciences': '#059669',
    'Consumer Studies': '#EC4899',
    'IsiZulu First Additional Language': '#F59E0B',
    'IsiXhosa First Additional Language': '#F59E0B',
  };
  return colorMap[subject] || theme.colors.primary;
};

const getGreeting = (userName: string) => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 11) {
    return `Good morning, ${userName}! What a wonderful time to play and learn.`;
  } else if (hour >= 11 && hour < 17) {
    return `Good afternoon, ${userName}! Let's make learning an adventure.`;
  } else if (hour >= 17 && hour < 22) {
    return `Good evening, ${userName}! Still curious? Let's explore more.`;
  } else {
    return `Burning the midnight oil, ${userName}? Let's dive into some fun learning.`;
  }
};

const openBoltWebsite = async () => {
  try {
    await WebBrowser.openBrowserAsync('https://www.bolt.new');
  } catch (error) {
    Alert.alert('Error', 'Could not open the website');
  }
};

const navigateToProfile = () => {
  router.push('/profile');
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { getTodayStats, getWeeklyStats, isLoading: statsLoading } = useStats();
  const { getNextClass, activeTimetable } = useTimetable();
  const { isSubscribed } = useStripe();
  const { userStats } = useGameQuestions();
  
  const userName = user?.full_name?.split(' ')[0] || 'Looma';
  
  const [activeSubject, setActiveSubject] = useState('');
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
  const [selectedBattleSubject, setSelectedBattleSubject] = useState<string>('');
  
  // Animation for Play button - only pulse, no fade
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate responsive card dimensions with better mobile handling
  const isSmallMobile = screenWidth < 375; // iPhone SE and smaller
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth <= 1024;
  const isLargeScreen = screenWidth > 1024;
  
  const cardPadding = isMobile ? 20 : 32; // Reduced padding on mobile
  const cardGap = isSmallMobile ? 8 : (isMobile ? 10 : (isTablet ? 16 : 12));
  const availableWidth = screenWidth - cardPadding;
  
  // Enhanced dynamic sizing logic with better mobile support
  let cardWidth, cardHeight;
  
  if (isLargeScreen) {
    // Large screens: rectangular cards
    cardWidth = (availableWidth - (cardGap * 3)) / 4; // 4 cards now
    cardHeight = Math.min(cardWidth * 0.7, 95);
  } else if (isTablet) {
    // Tablet: slightly rectangular
    cardWidth = (availableWidth - (cardGap * 3)) / 4; // 4 cards now
    cardHeight = Math.min(cardWidth * 0.8, 85);
  } else if (isSmallMobile) {
    // Small mobile: compact square cards with more conservative sizing
    const maxCardWidth = Math.min(60, (availableWidth - (cardGap * 3)) / 4); // 4 cards now
    cardWidth = maxCardWidth;
    cardHeight = maxCardWidth + 5; // Slightly taller to accommodate text
  } else {
    // Regular mobile: square cards
    const maxCardWidth = Math.min(70, (availableWidth - (cardGap * 3)) / 4); // 4 cards now
    cardWidth = maxCardWidth;
    cardHeight = maxCardWidth + 5;
  }

  // Enhanced responsive text and icon sizes with better mobile scaling
  const iconSize = isSmallMobile 
    ? Math.max(12, Math.min(16, cardWidth * 0.25))
    : Math.max(14, Math.min(20, cardWidth * 0.28));
    
  const numberFontSize = isSmallMobile 
    ? Math.max(10, Math.min(14, cardWidth * 0.22))
    : Math.max(12, Math.min(18, cardWidth * 0.24));
    
  const labelFontSize = isSmallMobile 
    ? Math.max(7, Math.min(9, cardWidth * 0.12))
    : Math.max(8, Math.min(11, cardWidth * 0.14));
    
  const cardPaddingInternal = isSmallMobile 
    ? Math.max(4, cardWidth * 0.08)
    : Math.max(6, cardWidth * 0.10);

  // Icon container size with better mobile scaling
  const iconContainerSize = iconSize + (isSmallMobile ? 4 : 6);

  // Get user's subjects from the database
  const userSubjects = user?.subjects || [];

  // Get real stats from database
  const todayStats = getTodayStats();
  const weeklyStats = getWeeklyStats();
  const nextClass = getNextClass();
  
  // Game stats
  const gameStats = {
    todayPoints: todayStats?.points_earned || 0,
    timeSpent: userStats?.total_time_spent || 0,
    gamesPlayed: userStats?.games_played || 0,
    correctRatio: userStats?.correct_ratio || 0,
  };

  // Set default active subject if none is selected
  useEffect(() => {
    if (userSubjects.length > 0 && !activeSubject) {
      setActiveSubject(userSubjects[0]);
    }
  }, [userSubjects]);

  // Function to upload user activity data to Supabase
  const uploadActivityToSupabase = async () => {
    if (!user?.id) return;

    try {
      // Upload current session data to study_log
      const { error } = await supabase
        .from('study_log')
        .insert({
          user_id: user.id,
          subject: activeSubject || 'General',
          topic: 'Home Screen Activity',
          time_spent: 0.1, // Small amount for home screen visit
          score: 0,
          date: new Date().toISOString().split('T')[0]
        });

      if (error) {
        console.error('Error uploading activity to Supabase:', error);
      }
    } catch (error) {
      console.error('Failed to upload activity:', error);
    }
  };

  // Upload activity when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      uploadActivityToSupabase();
    }, [user?.id, activeSubject])
  );

  // Pulse animation function
  const startPulseAnimation = () => {
    const pulseSequence = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    };

    // Start immediately
    pulseSequence();
    
    // Set up interval for continuous pulsing
    pulseIntervalRef.current = setInterval(pulseSequence, 3000);
  };

  const stopPulseAnimation = () => {
    if (pulseIntervalRef.current) {
      clearInterval(pulseIntervalRef.current);
      pulseIntervalRef.current = null;
    }
  };

  // Use useFocusEffect to handle screen focus/blur
  useFocusEffect(
    React.useCallback(() => {
      // Start animation when screen comes into focus
      startPulseAnimation();
      
      // Cleanup when screen loses focus
      return () => {
        stopPulseAnimation();
      };
    }, [])
  );

  // Also handle component unmount
  useEffect(() => {
    return () => {
      stopPulseAnimation();
    };
  }, []);

  const navigateToGameMap = () => {
    if (activeSubject) {
      router.push({
        pathname: '/game-map',
        params: { subject: activeSubject }
      });
    } else {
      Alert.alert('Select Subject', 'Please select a subject first to start your adventure.');
    }
  };

  const openQuickBattle = () => {
    if (!isSubscribed ) {
      // Occasionally show subscription modal
      setShowSubscriptionModal(true);
    } else {
      setShowBattleModal(true);
    }
  };

  const handleBattleStart = (opponent: any, subject: string) => {
    setSelectedOpponent(opponent);
    setSelectedBattleSubject(subject);
    console.log(`Starting battle with ${opponent.name} on subject ${subject}`);
  };

  const handleTimetablePress = () => {
    if (activeTimetable) {
      router.push('/timetable-edit');
    } else {
      router.push('/timetable-setup');
    }
  };

  const handleNextClassPress = () => {
    if (activeTimetable) {
      router.push('/timetable-edit');
    } else {
      Alert.alert(
        'Setup Timetable',
        'Set up your timetable to see your next class and track homework.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Setup Now', onPress: () => router.push('/timetable-setup') }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Image 
            source={require('@/assets/images/12.png')}
            style={styles.loomaLogo}
            resizeMode="contain"
          />
          
          <View style={styles.rightSection}>
            <TouchableOpacity 
              style={styles.boltBranding}
              onPress={openBoltWebsite}
              activeOpacity={0.7}
            >
              <View style={styles.boltContainer}>
                <Image
                  source={require('@/assets/images/boltlogo1.png')}
                  style={styles.boltLogo}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={navigateToProfile}
              style={styles.profileButton}
              activeOpacity={0.7}
            >
              {user?.profile_image ? (
                <Image 
                  source={{ uri: user.profile_image }}
                  style={styles.profileImage}
                />
              ) : (
                <Ionicons 
                  name="person-circle-outline" 
                  size={32} 
                  color={theme.colors.primary} 
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>
            {getGreeting(userName)}
          </Text>
        </View>

        {/* Next Class Banner */}
        {nextClass && (
          <TouchableOpacity
            style={styles.nextClassBanner}
            onPress={handleNextClassPress}
            activeOpacity={0.8}
          >
            <View style={styles.bannerContent}>
              <View style={styles.leftSection}>
                <View style={styles.iconContainer}>
                  <Ionicons name="time" size={24} color={theme.colors.primary} />
                </View>
                
                <View style={styles.classInfo}>
                  <View style={styles.classHeader}>
                    <Text style={styles.nextClassLabel}>
                      Next Class - {nextClass.day}
                    </Text>
                  </View>
                  
                  <Text style={styles.subjectName}>{nextClass.subject}</Text>
                  <Text style={styles.classTime}>{nextClass.time}</Text>
                  
                  {(nextClass.teacher || nextClass.room) && (
                    <View style={styles.classDetails}>
                      {nextClass.teacher && (
                        <Text style={styles.detailText}>{nextClass.teacher}</Text>
                      )}
                      {nextClass.room && (
                        <Text style={styles.detailText}>{nextClass.room}</Text>
                      )}
                    </View>
                  )}
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color={theme.colors.secondary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Stats Cards - Enhanced responsive sizing with real data */}
        <View style={[
          styles.statsContainer,
          { 
            paddingHorizontal: cardPadding / 2,
            gap: cardGap,
          }
        ]}>
          {/* Looma Cells Card */}
          <View style={[
            styles.statCard, 
            { 
              width: cardWidth, 
              height: cardHeight,
              padding: cardPaddingInternal,
            }
          ]}>
            <View style={[
              styles.statIconContainer, 
              { 
                backgroundColor: `${theme.colors.accent}15`,
                width: iconContainerSize,
                height: iconContainerSize,
                borderRadius: iconContainerSize / 2,
                marginBottom: isSmallMobile ? 4 : 6,
              }
            ]}>
              <Ionicons name="bulb" size={iconSize} color={theme.colors.accent} />
            </View>
            <Text style={[
              styles.statNumber, 
              { 
                fontSize: numberFontSize,
                marginBottom: isSmallMobile ? 1 : 2,
              }
            ]}>{(user?.looma_cells || user?.total_points || 0) + gameStats.todayPoints}</Text>
            {isSubscribed && (
              <Text style={[
                styles.premiumBadge,
                { fontSize: labelFontSize - 1 }
              ]}>⭐ 2x</Text>
            )}
            <Text style={[
              styles.statLabel, 
              { 
                fontSize: labelFontSize,
                lineHeight: labelFontSize + 0,
              }
            ]}>Looma Cells</Text>
          </View>
          
          {/* Study Time Card */}
          <View style={[
            styles.statCard, 
            { 
              width: cardWidth, 
              height: cardHeight,
              padding: cardPaddingInternal,
            }
          ]}>
            <View style={[
              styles.statIconContainer, 
              { 
                backgroundColor: `${theme.colors.primary}15`,
                width: iconContainerSize,
                height: iconContainerSize,
                borderRadius: iconContainerSize / 2,
                marginBottom: isSmallMobile ? 4 : 6,
              }
            ]}>
              <Ionicons name="time" size={iconSize} color={theme.colors.primary} />
            </View>
            <Text style={[
              styles.statNumber, 
              { 
                fontSize: numberFontSize,
                marginBottom: isSmallMobile ? 1 : 2,
              }
            ]}>{Math.floor(((user?.total_study_time || 0) * 60 + (user?.total_study_minutes || 0) + (gameStats.timeSpent / 60)) / 60)}h</Text>
            <Text style={[
              styles.statLabel, 
              { 
                fontSize: labelFontSize,
                lineHeight: labelFontSize + 0,
              }
            ]}>Study Time</Text>
          </View>
          
          {/* Looma Days Card */}
          <View style={[
            styles.statCard, 
            { 
              width: cardWidth, 
              height: cardHeight,
              padding: cardPaddingInternal,
            }
          ]}>
            <View style={[
              styles.statIconContainer, 
              { 
                backgroundColor: '#9333EA15',
                width: iconContainerSize,
                height: iconContainerSize,
                borderRadius: iconContainerSize / 2,
                marginBottom: isSmallMobile ? 4 : 6,
              }
            ]}>
              <Ionicons name="flame" size={iconSize} color="#9333EA" />
            </View>
            <Text style={[
              styles.statNumber, 
              { 
                fontSize: numberFontSize,
                marginBottom: isSmallMobile ? 1 : 2,
              }
            ]}>{user?.day_streak || 0}</Text>
            <Text style={[
              styles.statLabel, 
              { 
                fontSize: labelFontSize,
                
              }
            ]}>Streak Days</Text>
          </View>

          {/* My Timetable Card */}
          <TouchableOpacity 
            style={[
              styles.statCard, 
              styles.timetableCard,
              { 
                width: cardWidth, 
                height: cardHeight,
                padding: cardPaddingInternal,
              }
            ]}
            onPress={handleTimetablePress}
            activeOpacity={0.8}
          >
            <View style={[
              styles.statIconContainer, 
              { 
                backgroundColor: `${theme.colors.secondary}15`,
                width: iconContainerSize,
                height: iconContainerSize,
                borderRadius: iconContainerSize / 2,
                marginBottom: isSmallMobile ? 4 : 6,
              }
            ]}>
              <Ionicons name="calendar" size={iconSize} color={theme.colors.secondary} />
            </View>
            <Text style={[
              styles.statNumber, 
              { 
                fontSize: numberFontSize,
                marginBottom: isSmallMobile ? 1 : 2,
              }
            ]}></Text>
            <Text style={[
              styles.statLabel, 
              { 
                fontSize: labelFontSize,
                lineHeight: labelFontSize + 0,
              }
            ]}>My Timetable</Text>
          </TouchableOpacity>
        </View>

        {/* My Subjects Section */}
        <View style={styles.subjectsSection}>
          <Text style={styles.sectionTitle}>My Subjects</Text>
          {userSubjects.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subjectsContainer}
            >
              {userSubjects.map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={[
                    styles.subjectButton,
                    { backgroundColor: `${getSubjectColor(subject)}15` },
                    activeSubject === subject && [
                      styles.activeSubjectButton,
                      { borderColor: getSubjectColor(subject) }
                    ]
                  ]}
                  onPress={() => setActiveSubject(subject)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={getSubjectIcon(subject) as any} 
                    size={18} 
                    color={getSubjectColor(subject)} 
                  />
                  <Text style={[
                    styles.subjectText,
                    { color: getSubjectColor(subject) },
                    activeSubject === subject && styles.activeSubjectText
                  ]}>
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noSubjectsContainer}>
              <Text style={styles.noSubjectsText}>
                No subjects found – please update your profile.
              </Text>
              <TouchableOpacity 
                style={styles.updateProfileButton}
                onPress={() => router.push('/edit-profile')}
                activeOpacity={0.8}
              >
                <Text style={styles.updateProfileButtonText}>Update Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Play Button with Enhanced Game-like Design - Only Pulse Animation */}
        <View style={styles.playSection}>
          <Animated.View style={{ 
            transform: [{ scale: pulseAnim }],
          }}>
            <TouchableOpacity 
              style={styles.playButton}
              onPress={navigateToGameMap}
              activeOpacity={0.8}
            >
              <View style={styles.playButtonContent}>
                <View style={styles.playIconContainer}>
                  <Ionicons name="play" size={32} color={theme.colors.base} />
                </View>
                <View style={styles.playTextContainer}>
                  <Text style={styles.playButtonTitle}>START ADVENTURE</Text>
                 
                </View>
              </View>
              
              {/* Game-like decorative elements */}
              <View style={styles.playButtonDecorations}>
                <View style={[styles.playButtonCorner, styles.topLeft]} />
                <View style={[styles.playButtonCorner, styles.topRight]} />
                <View style={[styles.playButtonCorner, styles.bottomLeft]} />
                <View style={[styles.playButtonCorner, styles.bottomRight]} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Quick Battle Section */}
        <View style={styles.battleSection}>
          <View style={styles.battleCard}>
            <Text style={styles.battleTitle}>⚔️ Quick Battle ⚔️</Text>
            
            <View style={styles.battleArena}>
              {/* Player 1 */}
              <View style={styles.playerContainer}>
                <Image 
                  source={{ uri: user?.profile_image || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop' }}
                  style={styles.playerImage}
                />
                <Text style={styles.playerName}>{userName}</Text>
                
              
              </View>

              {/* VS */}
              <View style={styles.vsContainer}>
                <View style={styles.vsBurst}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
              </View>

              {/* Player 2 */}
              <View style={styles.playerContainer}>
                <Image 
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png' }} 
                  style={styles.playerImage}
                />

                <Text style={styles.playerName}>Friend</Text>
               
              </View>
            </View>

            <TouchableOpacity 
              style={styles.battleButton}
              onPress={openQuickBattle}
              activeOpacity={0.8}
            >
              <Text style={styles.battleButtonText}>Quick Battle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Quick Battle Modal */}
      <QuickBattleModal
        visible={showBattleModal}
        onClose={() => setShowBattleModal(false)}
        onBattleStart={handleBattleStart}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        context="general"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.base,
  },
  scrollView: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  boltBranding: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  boltContainer: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boltLogo: {
    width: 80,
    height: 20,
  },
  loomaLogo: {
    width: 80,
    height: 50,
  },
  boltText: {
    color: theme.colors.base,
    fontSize: 14,
    fontWeight: '600',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  greetingSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.secondary,
    lineHeight: 26,
    textAlign: 'left',
  },
  nextClassBanner: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}08`,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  classInfo: {
    flex: 1,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  nextClassLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 2,
  },
  classTime: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  classDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}08`,
  },
  timetableCard: {
    borderWidth: 2,
    borderColor: `${theme.colors.secondary}20`,
  },
  statIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  statLabel: {
    color: theme.colors.secondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  premiumBadge: {
    color: '#FFD700',
    fontWeight: '700',
    marginBottom: 2,
  },
  subjectsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  subjectsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  noSubjectsContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 20,
  },
  noSubjectsText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    marginBottom: 16,
    textAlign: 'center',
  },
  updateProfileButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  updateProfileButtonText: {
    color: theme.colors.base,
    fontSize: 14,
    fontWeight: '600',
  },
  subjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  activeSubjectButton: {
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeSubjectText: {
    fontWeight: '700',
  },
  playSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  playButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: theme.colors.secondary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  playButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  playIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playTextContainer: {
    alignItems: 'flex-start',
  },
  playButtonTitle: {
    color: theme.colors.base,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playButtonSubtitle: {
    color: theme.colors.base,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
    marginTop: 2,
  },
  playButtonDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  playButtonCorner: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderColor: theme.colors.base,
    borderWidth: 2,
  },
  topLeft: {
    top: 8,
    left: 8,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 8,
    right: 8,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 8,
    left: 8,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 8,
    right: 8,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  battleSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  battleCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 16,
    padding: 20,
  },
  battleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  battleArena: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  playerContainer: {
    alignItems: 'center',
    flex: 1,
  },
  playerImage: {
    
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 8,
  },
  healthBarContainer: {
    width: '80%',
    marginBottom: 8,
  },
  healthBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
  },
  brainIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  vsContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  vsBurst: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.base,
  },
  battleButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  battleButtonText: {
    color: theme.colors.base,
    fontWeight: '700'
  },
});