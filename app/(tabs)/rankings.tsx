import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Image,
  Share,
  Alert,
  Dimensions,
  Modal,
  ActivityIndicator,
  RefreshControl,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useStripe } from '@/hooks/useStripe';
import { useStats } from '@/hooks/useStats';
import SubscriptionModal from '@/components/SubscriptionModal';

const { width: screenWidth } = Dimensions.get('window');

// Challenge data
const challenges = [
  {
    id: 'math-sprint',
    title: '🧮 Math Sprint Challenge',
    description: 'Solve 10 algebra problems in under 5 minutes',
    reward: 150,
    difficulty: 'Medium',
    timeLimit: '5 min',
    icon: 'calculator',
    color: '#8B5CF6',
  },
  {
    id: 'science-quiz',
    title: '🔬 Science Quiz Blitz',
    description: 'Answer 15 biology questions correctly',
    reward: 200,
    difficulty: 'Hard',
    timeLimit: '8 min',
    icon: 'flask',
    color: '#10B981',
  },
  {
    id: 'english-vocab',
    title: '📚 Vocabulary Master',
    description: 'Define 20 advanced English words',
    reward: 120,
    difficulty: 'Easy',
    timeLimit: '6 min',
    icon: 'book',
    color: '#3B82F6',
  },
  {
    id: 'history-timeline',
    title: '🏛️ History Timeline',
    description: 'Arrange 12 historical events in order',
    reward: 180,
    difficulty: 'Medium',
    timeLimit: '7 min',
    icon: 'time',
    color: '#F59E0B',
  },
];

const getRankColor = (rank: number) => {
  if (rank <= 3) return '#FFD700'; // Gold
  if (rank <= 10) return '#C0C0C0'; // Silver
  if (rank <= 20) return '#CD7F32'; // Bronze
  return theme.colors.secondary; // Default
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return 'trophy';
  if (rank === 2) return 'medal';
  if (rank === 3) return 'medal';
  return 'ribbon';
};

const getMotivationalMessage = (userRank: number) => {
  if (userRank === 1) return "🏆 You're the champion! Keep dominating! 👑";
  if (userRank <= 3) return "🥇 Amazing! You're in the top 3! Keep it up! ⭐";
  if (userRank <= 10) return `🔥 You're only ${Math.max(1, userRank - 3)} spots away from the Top 3! 💪`;
  if (userRank <= 20) return `🎯 You're only ${10 - userRank + 1} spots away from the Top 10! 💪`;
  return "🔥 Keep your streak alive and climb that leaderboard! 🚀";
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'easy': return '#10B981';
    case 'medium': return '#F59E0B';
    case 'hard': return '#EF4444';
    default: return theme.colors.primary;
  }
};

export default function RankingsScreen() {
  const { user } = useAuth();
  const { 
    allTimeLeaderboard, 
    userRank, 
    isLoading: leaderboardLoading, 
    fetchLeaderboards 
  } = useLeaderboard();
  const { createStudySession, completeStudySession } = useStats();
  const { isSubscribed } = useStripe();
  
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<'weekly' | 'monthly' | 'all_time'>('all_time');

  const currentUserRank = userRank.allTime || 0;
  const leaderboardData = allTimeLeaderboard.slice(0, 30); // Top 30

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchLeaderboards();
    } catch (error) {
      console.error('Error refreshing leaderboards:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleShareProgress = async () => {
    if (!user) return;

    try {
      const message = `🏆 Check out my LoomaLearn progress!\n\n` +
        `📊 Rank: #${currentUserRank || 'Unranked'}\n` +
        `🧠 LBC: ${user.total_points?.toLocaleString() || user.looma_cells?.toLocaleString() || 0}\n` +
        `🔥 Streak: ${user.day_streak || 0} days\n` +
        `⏰ Study Time: ${Math.floor((user.total_study_time || 0) * 60 + (user.total_study_minutes || 0)) / 60}h\n` +
        `🎯 Level: ${user.level || 1}\n\n` +
        `Join me on LoomaLearn! 🚀`;

      await Share.share({
        message,
        title: 'My LoomaLearn Progress',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share progress');
    }
  };

  const handleTakeChallenge = () => {
    if (!isSubscribed && Math.random() > 0.7) {
      // Occasionally show subscription modal instead of challenge modal
      setShowSubscriptionModal(true);
    } else {
      setShowChallengeModal(true);
    }
  };

  const handleStartChallenge = async (challenge: any) => {
    setShowChallengeModal(false);
    
    try {
      // Create a study session for the challenge
      const session = await createStudySession('challenge', 'game');
      
      Alert.alert(
        `🚀 ${challenge.title}`,
        `Challenge started! You have ${challenge.timeLimit} to complete this challenge and earn ${challenge.reward} LBC.\n\nGood luck! 🍀`,
        [
          {
            text: 'Start Now!',
            style: 'default',
            onPress: () => {
              // Simulate challenge completion after a delay
              setTimeout(async () => {
                if (session) {
                  // Complete the session with earned points
                  await completeStudySession(session.id, 5, challenge.reward);
                  
                  Alert.alert(
                    '🎉 Challenge Complete!',
                    `Congratulations! You've earned ${challenge.reward} LBC!\n\nYour new LBC total: ${((user?.total_points || user?.looma_cells || 0) + challenge.reward).toLocaleString()}`,
                    [{ text: 'Awesome!', style: 'default' }]
                  );
                  
                  // Refresh leaderboards to show updated ranking
                  fetchLeaderboards();
                }
              }, 2000);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error starting challenge:', error);
      Alert.alert('Error', 'Failed to start challenge. Please try again.');
    }
  };

  const handleUserTap = (leaderboardUser: any) => {
    if (leaderboardUser.id === user?.id) {
      Alert.alert('Your Profile', `This is your current ranking! Keep up the great work! 🎉`);
    } else {
      Alert.alert(
        `${leaderboardUser.full_name || 'User'}'s Stats`,
        `🏫 School: ${leaderboardUser.school_name || 'Unknown'}\n🧠 LBC: ${leaderboardUser.points?.toLocaleString() || 0}\n🔥 Streak: ${leaderboardUser.day_streak || 0} days\n🎯 Level: ${leaderboardUser.level || 1}`,
        [{ text: 'Cool!', style: 'default' }]
      );
    }
  };

  const renderLeaderboardItem = (leaderboardUser: any) => {
    const rankColor = getRankColor(leaderboardUser.rank);
    const rankIcon = getRankIcon(leaderboardUser.rank);
    const isCurrentUser = leaderboardUser.id === user?.id;
    
    return (
      <TouchableOpacity
        key={leaderboardUser.id}
        style={[
          styles.leaderboardItem,
          isCurrentUser && styles.currentUserItem,
          leaderboardUser.rank <= 3 && styles.topThreeItem,
        ]}
        onPress={() => handleUserTap(leaderboardUser)}
        activeOpacity={0.7}
      >
        {/* Rank Number */}
        <View style={[styles.rankContainer, { backgroundColor: `${rankColor}20` }]}>
          <Ionicons 
            name={rankIcon as any} 
            size={leaderboardUser.rank <= 3 ? 20 : 16} 
            color={rankColor} 
          />
          <Text style={[styles.rankNumber, { color: rankColor }]}>
            #{leaderboardUser.rank}
          </Text>
        </View>

        {/* Profile Image */}
        <Image 
          source={{ 
            uri: leaderboardUser.profile_image || 
                 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop'
          }}
          style={[
            styles.profileImage,
            isCurrentUser && styles.currentUserImage,
            leaderboardUser.rank <= 3 && styles.topThreeImage,
          ]}
        />

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={[
            styles.username,
            isCurrentUser && styles.currentUserText
          ]}>
            {leaderboardUser.full_name || 'Anonymous User'}
            {isCurrentUser && ' (You)'}
          </Text>
          <Text style={styles.school}>{leaderboardUser.school_name || 'Unknown School'}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="bulb" size={12} color={theme.colors.accent} />
              <Text style={styles.statText}>{leaderboardUser.points?.toLocaleString() || 0} LBC</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="flame" size={12} color="#FF6B35" />
              <Text style={styles.statText}>{leaderboardUser.day_streak || 0}d</Text>
            </View>
          </View>
        </View>

        {/* Arrow */}
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={isCurrentUser ? theme.colors.primary : theme.colors.secondary} 
          style={styles.arrow}
        />

        {/* Special effects for top 3 */}
        {leaderboardUser.rank <= 3 && (
          <View style={styles.topThreeGlow} />
        )}
      </TouchableOpacity>
    );
  };

  const renderChallengeItem = (challenge: any) => (
    <TouchableOpacity
      key={challenge.id}
      style={[styles.challengeItem, { borderLeftColor: challenge.color }]}
      onPress={() => handleStartChallenge(challenge)}
      activeOpacity={0.7}
    >
      <View style={styles.challengeHeader}>
        <View style={[styles.challengeIcon, { backgroundColor: `${challenge.color}15` }]}>
          <Ionicons name={challenge.icon as any} size={24} color={challenge.color} />
        </View>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeDescription}>{challenge.description}</Text>
        </View>
      </View>
      
      <View style={styles.challengeFooter}>
        <View style={styles.challengeStats}>
          <View style={[styles.difficultyBadge, { backgroundColor: `${getDifficultyColor(challenge.difficulty)}15` }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(challenge.difficulty) }]}>
              {challenge.difficulty}
            </Text>
          </View>
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={14} color={theme.colors.secondary} />
            <Text style={styles.timeText}>{challenge.timeLimit}</Text>
          </View>
        </View>
        <View style={styles.rewardContainer}>
          <Ionicons name="bulb" size={16} color={theme.colors.accent} />
          <Text style={styles.rewardText}>+{challenge.reward} LBC</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (leaderboardLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rankings</Text>
        <TouchableOpacity 
          style={styles.challengeButton}
          onPress={handleTakeChallenge}
          activeOpacity={0.7}
        >
          <Ionicons name="flash" size={20} color={theme.colors.base} />
          <Text style={styles.challengeButtonText}>Challenge</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* 3D Activity Trophy Graph */}
        <View style={styles.trophySection}>
          <View style={styles.trophyCard}>
            <Text style={styles.trophyTitle}>🏆 Your Achievement Dashboard</Text>
            
            {/* Mock 3D Graph - Using placeholder image */}
            <View style={styles.graphContainer}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop' }}
                style={styles.graphImage}
                resizeMode="cover"
              />
              <View style={styles.graphOverlay}>
                <Text style={styles.graphOverlayText}>Activity Graph</Text>
              </View>
            </View>

            {/* Share Button */}
            <TouchableOpacity 
              style={styles.shareProgressButton}
              onPress={handleShareProgress}
              activeOpacity={0.8}
            >
              <Ionicons name="share" size={20} color={theme.colors.base} />
              <Text style={styles.shareProgressText}>Share My Progress</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Motivational Message */}
        {currentUserRank > 0 && (
          <View style={styles.motivationalSection}>
            <Text style={styles.motivationalText}>
              {getMotivationalMessage(currentUserRank)}
            </Text>
          </View>
        )}

        {/* Leaderboard */}
        <View style={styles.leaderboardSection}>
          <Text style={styles.sectionTitle}>🔥 Top Learners</Text>
          
          {leaderboardData.length > 0 ? (
            <View style={styles.leaderboardContainer}>
              {leaderboardData.map(renderLeaderboardItem)}
            </View>
          ) : (
            <View style={styles.emptyLeaderboard}>
              <Ionicons name="trophy-outline" size={48} color={theme.colors.primary} />
              <Text style={styles.emptyLeaderboardText}>No rankings available yet</Text>
              <Text style={styles.emptyLeaderboardSubtext}>
                Start learning to appear on the leaderboard!
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Challenge Modal */}
      <Modal
        visible={showChallengeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChallengeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚡ Boost Your LBC</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowChallengeModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Take on these challenges to earn extra Looma Brain Cells and climb the leaderboard! 🚀
            </Text>

            <ScrollView style={styles.challengesList} showsVerticalScrollIndicator={false}>
              {challenges.map(renderChallengeItem)}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.surfaceLight}60`,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  challengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  challengeButtonText: {
    color: theme.colors.base,
    fontSize: 14,
    fontWeight: '700',
  },
  trophySection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  trophyCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 20,
    padding: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}10`,
  },
  trophyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  graphContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    height: 160,
  },
  graphImage: {
    width: '100%',
    height: '100%',
  },
  graphOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(160, 95, 56, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphOverlayText: {
    color: theme.colors.base,
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  shareProgressButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  shareProgressText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '700',
  },
  motivationalSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  motivationalText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}20`,
  },
  leaderboardSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 16,
  },
  leaderboardContainer: {
    gap: 8,
  },
  emptyLeaderboard: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyLeaderboardText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  emptyLeaderboardSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    textAlign: 'center',
  },
  leaderboardItem: {
    backgroundColor: theme.colors.base,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${theme.colors.surfaceLight}80`,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  currentUserItem: {
    backgroundColor: `${theme.colors.primary}08`,
    borderColor: theme.colors.primary,
    borderWidth: 2,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  topThreeItem: {
    borderWidth: 2,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  topThreeGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    zIndex: -1,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    gap: 4,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: theme.colors.surfaceLight,
  },
  currentUserImage: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  topThreeImage: {
    borderWidth: 3,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 2,
  },
  currentUserText: {
    color: theme.colors.primary,
  },
  school: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  arrow: {
    opacity: 0.6,
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.base,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    lineHeight: 22,
    marginBottom: 24,
    opacity: 0.8,
  },
  challengesList: {
    flex: 1,
  },
  challengeItem: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    lineHeight: 20,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeStats: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.colors.secondary}10`,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.colors.accent}15`,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.accent,
  },
});