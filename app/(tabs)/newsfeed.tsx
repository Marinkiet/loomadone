import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

const { width: screenWidth } = Dimensions.get('window');

// Sample news feed data with gamified content
const newsData = [
  {
    id: '1',
    title: '🎉 You\'ve unlocked: Custom Avatars!',
    date: '2 hours ago',
    category: 'NewFeature',
    image: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop',
    content: '🧠 Boost your brain cells! Customize your learning avatar with new outfits, accessories, and expressions. Show off your unique style while conquering knowledge! 🔥',
    tags: ['#NewFeature', '#Customization', '#Avatar'],
    likes: 127,
    comments: 23,
    isLiked: false,
  },
  {
    id: '2',
    title: '🛠️ Patch 2.0 just dropped! Peek the new loot',
    date: '1 day ago',
    category: 'Update',
    image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop',
    content: 'Level up with this new feature! Enhanced study streaks, improved battle system, and brand new achievement badges. Your learning journey just got more epic! ⚡',
    tags: ['#Update', '#Features', '#LevelUp'],
    likes: 89,
    comments: 15,
    isLiked: true,
  },
  {
    id: '3',
    title: '🧠 Weekly Brain Challenge: Math Mastery',
    date: '2 days ago',
    category: 'Challenge',
    image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop',
    content: 'Ready to flex those Looma cells? This week\'s challenge focuses on advanced algebra. Complete 5 levels to earn the "Math Wizard" badge and 50 bonus brain cells! 🎯',
    tags: ['#Challenge', '#Math', '#Weekly'],
    likes: 156,
    comments: 34,
    isLiked: false,
  },
  {
    id: '4',
    title: '💡 Study Tip: The Pomodoro Power-Up',
    date: '3 days ago',
    category: 'Tips',
    image: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop',
    content: 'Unlock the secret to focused learning! Try the 25-minute study sessions with 5-minute breaks. Your brain cells will thank you, and your streak will soar! 🚀',
    tags: ['#Tips', '#StudyHacks', '#Focus'],
    likes: 203,
    comments: 41,
    isLiked: true,
  },
  {
    id: '5',
    title: '🏆 Leaderboard Legends: Meet This Month\'s Top Learners',
    date: '5 days ago',
    category: 'Events',
    image: 'https://images.pexels.com/photos/3184317/pexels-photo-3184317.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop',
    content: 'Shoutout to our learning legends! These amazing students have dominated the leaderboards with incredible dedication. Could you be next month\'s champion? 👑',
    tags: ['#Leaderboard', '#Champions', '#Motivation'],
    likes: 178,
    comments: 52,
    isLiked: false,
  },
];

const filterCategories = ['All', 'Updates', 'Tips', 'Events', 'Challenges'];

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'newfeature':
    case 'update':
      return '#3B82F6';
    case 'tips':
      return '#10B981';
    case 'events':
      return theme.colors.accent;
    case 'challenge':
      return '#8B5CF6';
    default:
      return theme.colors.primary;
  }
};

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'newfeature':
    case 'update':
      return 'rocket-outline';
    case 'tips':
      return 'bulb-outline';
    case 'events':
      return 'trophy-outline';
    case 'challenge':
      return 'fitness-outline';
    default:
      return 'newspaper-outline';
  }
};

export default function NewsFeedScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [posts, setPosts] = useState(newsData);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleLike = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1
            }
          : post
      )
    );
  };

  const filteredPosts = activeFilter === 'All' 
    ? posts 
    : posts.filter(post => 
        post.category.toLowerCase() === activeFilter.toLowerCase() ||
        (activeFilter === 'Challenges' && post.category.toLowerCase() === 'challenge')
      );

  const renderPost = (post: typeof newsData[0]) => (
    <View key={post.id} style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <View style={[
            styles.categoryIcon,
            { backgroundColor: `${getCategoryColor(post.category)}15` }
          ]}>
            <Ionicons 
              name={getCategoryIcon(post.category) as any} 
              size={16} 
              color={getCategoryColor(post.category)} 
            />
          </View>
          <View style={styles.postHeaderText}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postDate}>{post.date}</Text>
          </View>
        </View>
      </View>

      {/* Post Image */}
      {post.image && (
        <Image 
          source={{ uri: post.image }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {/* Post Content */}
      <View style={styles.postContent}>
        <Text style={styles.postText}>{post.content}</Text>
        
        {/* Tags */}
        <View style={styles.tagsContainer}>
          {post.tags.map((tag, index) => (
            <View key={index} style={[
              styles.tag,
              { backgroundColor: `${getCategoryColor(post.category)}10` }
            ]}>
              <Text style={[
                styles.tagText,
                { color: getCategoryColor(post.category) }
              ]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>

        {/* Interaction Row */}
        <View style={styles.interactionRow}>
          <TouchableOpacity 
            style={styles.interactionButton}
            onPress={() => handleLike(post.id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={post.isLiked ? "heart" : "heart-outline"} 
              size={20} 
              color={post.isLiked ? "#EF4444" : theme.colors.secondary} 
            />
            <Text style={[
              styles.interactionText,
              post.isLiked && { color: "#EF4444" }
            ]}>
              {post.likes}
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>News Feed</Text>
        <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.secondary} />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filterCategories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                activeFilter === category && styles.activeFilterChip
              ]}
              onPress={() => setActiveFilter(category)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterChipText,
                activeFilter === category && styles.activeFilterChipText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Posts Feed */}
      <ScrollView 
        style={styles.feedContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.postsContainer}>
          {filteredPosts.map(renderPost)}
        </View>

        {/* End of Feed Message */}
        <View style={styles.endOfFeed}>
          <Ionicons name="checkmark-circle" size={32} color={theme.colors.primary} />
          <Text style={styles.endOfFeedText}>You're all caught up! 🎉</Text>
          <Text style={styles.endOfFeedSubtext}>Check back later for more learning adventures</Text>
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
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.base,
  },
  notificationBadgeText: {
    color: theme.colors.base,
    fontSize: 12,
    fontWeight: '700',
  },
  filterContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.surfaceLight}40`,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.secondary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  activeFilterChipText: {
    color: theme.colors.base,
  },
  feedContainer: {
    flex: 1,
  },
  postsContainer: {
    padding: 16,
    gap: 20,
  },
  postCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}08`,
  },
  postHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  postHeaderText: {
    flex: 1,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
    lineHeight: 22,
    marginBottom: 4,
  },
  postDate: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.6,
  },
  postImage: {
    width: '100%',
    height: 180,
    backgroundColor: theme.colors.surfaceLight,
  },
  postContent: {
    padding: 16,
  },
  postText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: `${theme.colors.primary}10`,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interactionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  endOfFeed: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  endOfFeedText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginTop: 12,
    marginBottom: 4,
  },
  endOfFeedSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: theme.colors.secondary,
  },
});