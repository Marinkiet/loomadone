import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';
import { supabase } from '@/lib/supabase';
import { useStripe } from '@/hooks/useStripe';

// Motivational messages array
const motivationalMessages = [
  `Keep it up! Your brain Looma cells are on fire 🔥!`,
  `Amazing progress! You're becoming a learning legend! ⭐`,
  `Your curiosity is unstoppable! Keep exploring! 🚀`,
  `Brilliant work! Every question makes you stronger! 💪`,
  `You're on a roll! Learning looks great on you! ✨`,
];

const getRandomMotivationalMessage = () => {
  return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
};

const profileOptions = [
  {
    id: 'edit-profile',
    icon: 'create-outline',
    label: 'Edit Profile',
    color: theme.colors.primary,
  },
  {
    id: 'settings',
    icon: 'settings-outline',
    label: 'Settings',
    color: theme.colors.primary,
  },
  {
    id: 'notifications',
    icon: 'notifications-outline',
    label: 'Notification Preferences',
    color: '#3B82F6',
  },
  {
    id: 'friends',
    icon: 'people-outline',
    label: 'Friends & Social',
    color: '#10B981',
  },
  {
    id: 'learning-history',
    icon: 'bulb-outline',
    label: 'Learning History & Stats',
    color: '#8B5CF6',
  },
  {
    id: 'achievements',
    icon: 'trophy-outline',
    label: 'Achievements',
    color: theme.colors.accent,
  },
  {
    id: 'goals',
    icon: 'target-outline',
    label: 'Daily & Weekly Goals',
    color: '#F59E0B',
  },
  {
    id: 'study-preferences',
    icon: 'book-outline',
    label: 'Study Preferences',
    color: '#6366F1',
  },
  {
    id: 'help',
    icon: 'help-circle-outline',
    label: 'Help & Support',
    color: '#64748B',
  },
  {
    id: 'logout',
    icon: 'log-out-outline',
    label: 'Log Out',
    color: '#EF4444',
  },
];

// Subject color mapping for consistent styling
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

export default function ProfileScreen() {
  const [motivationalMessage] = useState(getRandomMotivationalMessage());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [learningHistory, setLearningHistory] = useState<any[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);
  const { user, signOut, isLoading, session } = useAuth();
  const { isSubscribed, currentPlan, cancelSubscription } = useStripe();

  useEffect(() => {
    if (user) {
      fetchLearningHistory();
    }
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setProfileError(null);
    
    try {
      // Refresh learning history
      await fetchLearningHistory();
    } catch (error) {
      setProfileError('Failed to refresh profile data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchLearningHistory = async () => {
    if (!user) return;
    
    try {
      // Get recent learning history
      const { data, error } = await supabase.rpc('get_user_learning_history', {
        user_uuid: user.id,
        limit_count: 5
      });
      
      if (error) throw error;
      setLearningHistory(data || []);
    } catch (error: any) {

    }
  };

  const handleOptionPress = async (optionId: string) => {
    switch (optionId) {
      case 'edit-profile':
        router.push('/edit-profile');
        break;
      case 'learning-history':
        router.push('/learning-history');
        break;
      case 'subscription':
        if (isSubscribed) {
          Alert.alert(
            'Manage Subscription',
            `You are currently subscribed to the ${currentPlan || 'Premium'} plan. Would you like to cancel your subscription?`,
            [
              { text: 'Keep Subscription', style: 'cancel' },
              { 
                text: 'Cancel Subscription', 
                style: 'destructive', 
                onPress: async () => {
                  try {
                    await cancelSubscription();
                  } catch (error) {
                    Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
                  }
                }
              },
            ]
          );
        } else {
          router.push('/subscription');
        }
        break;
      case 'logout':
        Alert.alert(
          'Log Out',
          'Are you sure you want to log out?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Log Out', 
              style: 'destructive', 
              onPress: async () => {
                try {
                  await signOut();
                  router.replace('/');
                } catch (error) {
                  Alert.alert('Error', 'Failed to log out. Please try again.');
                }
              }
            },
          ]
        );
        break;
      default:
        Alert.alert('Coming Soon', `${profileOptions.find(opt => opt.id === optionId)?.label} feature will be available soon!`);
        break;
    }
  };

  const formatJoinDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
    } catch {
      return 'Recently';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (profileError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Unable to load profile</Text>
          <Text style={styles.errorText}>{profileError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRefresh}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const dynamicProfileOptions = [
    {
      id: 'edit-profile',
      icon: 'create-outline',
      label: 'Edit Profile',
      color: theme.colors.primary,
    },
    {
      id: 'subscription',
      icon: 'star-outline',
      label: isSubscribed ? 'Manage Subscription' : 'Upgrade to Premium',
      color: '#FFD700',
    },
    {
      id: 'settings',
      icon: 'settings-outline',
      label: 'Settings',
      color: theme.colors.primary,
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      label: 'Notification Preferences',
      color: '#3B82F6',
    },
    {
      id: 'friends',
      icon: 'people-outline',
      label: 'Friends & Social',
      color: '#10B981',
    },
    {
      id: 'learning-history',
      icon: 'bulb-outline',
      label: 'Learning History & Stats',
      color: '#8B5CF6',
    },
    {
      id: 'achievements',
      icon: 'trophy-outline',
      label: 'Achievements',
      color: theme.colors.accent,
    },
    {
      id: 'goals',
      icon: 'target-outline',
      label: 'Daily & Weekly Goals',
      color: '#F59E0B',
    },
    {
      id: 'study-preferences',
      icon: 'book-outline',
      label: 'Study Preferences',
      color: '#6366F1',
    },
    {
      id: 'help',
      icon: 'help-circle-outline',
      label: 'Help & Support',
      color: '#64748B',
    },
    {
      id: 'logout',
      icon: 'log-out-outline',
      label: 'Log Out',
      color: '#EF4444',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Learning History Preview */}
      {learningHistory.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Learning</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/learning-history')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.historyList}>
            {learningHistory.slice(0, 3).map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyItemLeft}>
                  <Text style={styles.historyDate}>{item.date}</Text>
                  <Text style={styles.historyTopic}>{item.topic}</Text>
                </View>
                <View style={styles.historyItemRight}>
                  <View style={styles.historyStats}>
                    <Ionicons name="time" size={14} color={theme.colors.secondary} />
                    <Text style={styles.historyStatText}>
                      {item.time_spent < 1 
                        ? `${Math.round(item.time_spent * 60)}m` 
                        : `${Math.floor(item.time_spent)}h ${Math.round((item.time_spent % 1) * 60)}m`}
                    </Text>
                  </View>
                  <View style={styles.historyStats}>
                    <Ionicons name="star" size={14} color={theme.colors.accent} />
                    <Text style={styles.historyStatText}>{item.performance_score} pts</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Motivational Message */}
        <View style={styles.motivationalSection}>
          <Text style={styles.motivationalText}>{motivationalMessage}</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userInfoCard}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ 
                uri: user?.profile_image || 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop' 
              }}
              style={styles.userAvatar}
            />
            {!user?.profile_image && (
              <View style={styles.defaultAvatarOverlay}>
                <Ionicons name="person" size={32} color={theme.colors.primary} />
              </View>
            )}
          </View>
          
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {user?.full_name || 'Looma Learner'}
            </Text>
            <Text style={styles.userGrade}>
              {user?.grade || 'No grade'}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email || session?.user?.email || 'No email'}
            </Text>
            {user?.created_at && (
              <Text style={styles.joinDate}>
                Joined {formatJoinDate(user.created_at)}
              </Text>
            )}
          </View>
        </View>

        {/* User Subjects */}
        {user?.subjects && user.subjects.length > 0 && (
          <View style={styles.subjectsSection}>
            <View style={styles.subjectsSectionHeader}>
              <Text style={styles.sectionTitle}>My Subjects</Text>
              <View style={styles.subjectsCount}>
                <Text style={styles.subjectsCountText}>
                  {user.subjects.length} subject{user.subjects.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subjectsScrollContainer}
            >
              <View style={styles.subjectsGrid}>
                {user.subjects.map((subject, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.subjectChip,
                      { 
                        backgroundColor: `${getSubjectColor(subject)}15`,
                        borderColor: `${getSubjectColor(subject)}30`
                      }
                    ]}
                  >
                    <Text style={[
                      styles.subjectText,
                      { color: getSubjectColor(subject) }
                    ]}>
                      {subject}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Profile Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Learning Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="bulb" size={24} color={theme.colors.accent} />
              <Text style={styles.statNumber}>
                {user?.looma_cells || 0}
                {isSubscribed && (
                  <Text style={styles.premiumBadgeText}> ⭐</Text>
                )}
              </Text>
              <Text style={styles.statLabel}>Looma Cells</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color={theme.colors.primary} />
              <Text style={styles.statNumber}>
                {Math.floor(user?.total_study_time || 0)}h
              </Text>
              <Text style={styles.statLabel}>Study Time</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={24} color="#FF6B35" />
              <Text style={styles.statNumber}>{user?.day_streak || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </View>

        {/* Profile Options */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Profile Options</Text>
          
          <View style={styles.optionsList}>
            {dynamicProfileOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionItem,
                  option.id === 'logout' && styles.logoutOption
                ]}
                onPress={() => handleOptionPress(option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View style={[
                    styles.optionIconContainer,
                    { backgroundColor: `${option.color}15` }
                  ]}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={22} 
                      color={option.color} 
                    />
                  </View>
                  <Text style={[
                    styles.optionLabel,
                    option.id === 'logout' && styles.logoutLabel
                  ]}>
                    {option.label}
                  </Text>
                </View>
                
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={theme.colors.secondary} 
                  style={styles.optionArrow}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfoSection}>
          <Text style={styles.appInfoText}>LoomaLearn v1.0.0</Text>
          <Text style={styles.appInfoSubtext}>Built with ❤️ for curious minds</Text>
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '600',
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: `${theme.colors.primary}15`,
  },
  scrollView: {
    flex: 1,
  },
  motivationalSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  motivationalText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  userInfoCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  defaultAvatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  userGrade: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.6,
  },
  subjectsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  subjectsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  subjectsCount: {
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  subjectsCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  subjectsScrollContainer: {
    paddingRight: 16,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectChip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.secondary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  historySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  historyList: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.primary}10`,
  },
  historyItemLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    marginBottom: 4,
  },
  historyTopic: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  historyItemRight: {
    alignItems: 'flex-end',
  },
  historyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  historyStatText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
  },
  optionsSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  optionsList: {
    gap: 2,
    marginTop: 16,
  },
  optionItem: {
    backgroundColor: theme.colors.base,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: `${theme.colors.surfaceLight}80`,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutOption: {
    borderColor: `${theme.colors.accent}30`,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    flex: 1,
  },
  logoutLabel: {
    color: '#EF4444',
  },
  optionArrow: {
    opacity: 0.6,
  },
  appInfoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  appInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
    opacity: 0.7,
    marginBottom: 4,
  },
  appInfoSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary,
    opacity: 0.8,
  },
  premiumBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
  },
});