import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Image,
  Alert,
  FlatList,
  RefreshControl,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  full_name?: string;
  email?: string;
  profile_image?: string;
  school_name?: string;
  grade?: string;
  level?: number;
  looma_cells?: number;
  day_streak?: number;
  subjects?: string[];
  bio?: string;
}

interface FriendshipStatus {
  status: 'not_connected' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked';
  friendshipId?: string;
}

interface UserWithFriendship extends User {
  friendshipStatus: FriendshipStatus;
  lastActive?: string;
  region?: string;
  mutualFriends?: number;
}

// Regions for filtering
const regions = ['All', 'Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth'];
const grades = ['All', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

export default function FriendsScreen() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<UserWithFriendship[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserWithFriendship[]>([]);
  const [followingList, setFollowingList] = useState<UserWithFriendship[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'following'>('discover');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [sortBy, setSortBy] = useState<'looma_cells' | 'full_name' | 'activity'>('looma_cells');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all users except current user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .neq('id', user.id);

      if (userError) throw userError;

      // Fetch all friendships where current user is involved
      const { data: friendshipsData, error: friendshipsError } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (friendshipsError) throw friendshipsError;

      // Process users with friendship status
      const processedUsers = userData.map((u: User) => {
        // Find friendship with this user
        const friendship = friendshipsData.find(
          f => (f.requester_id === user.id && f.addressee_id === u.id) || 
               (f.requester_id === u.id && f.addressee_id === user.id)
        );

        let friendshipStatus: FriendshipStatus = { status: 'not_connected' };

        if (friendship) {
          if (friendship.status === 'accepted') {
            friendshipStatus = { status: 'accepted', friendshipId: friendship.id };
          } else if (friendship.status === 'blocked') {
            friendshipStatus = { status: 'blocked', friendshipId: friendship.id };
          } else if (friendship.status === 'pending') {
            if (friendship.requester_id === user.id) {
              friendshipStatus = { status: 'pending_sent', friendshipId: friendship.id };
            } else {
              friendshipStatus = { status: 'pending_received', friendshipId: friendship.id };
            }
          }
        }

        // Add simulated last active status and region for UI purposes
        // In a real app, these would come from the database
        return {
          ...u,
          friendshipStatus,
          lastActive: Math.random() > 0.3 ? 'Online now' : `${Math.floor(Math.random() * 24)} hours ago`,
          region: regions[Math.floor(Math.random() * (regions.length - 1)) + 1],
          mutualFriends: Math.floor(Math.random() * 10)
        };
      });

      setAllUsers(processedUsers);
      
      // Set following list (accepted friendships)
      const following = processedUsers.filter(u => u.friendshipStatus.status === 'accepted');
      setFollowingList(following);
    } catch (err: any) {
      console.error('Error fetching users:', err.message);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Filter and sort users
  const filteredUsers = (activeTab === 'discover' ? (searchResults.length > 0 ? searchResults : allUsers) : followingList).filter(user => {
    const matchesRegion = selectedRegion === 'All' || user.region === selectedRegion;
    const matchesGrade = selectedGrade === 'All' || user.grade === selectedGrade;
    return matchesRegion && matchesGrade;
  })
    .sort((a, b) => {
      switch (sortBy) {
        case 'full_name':
          return (a.full_name || '').localeCompare(b.full_name || '');
        case 'activity':
          // Sort by online status and last active
          if (a.lastActive === 'Online now' && b.lastActive !== 'Online now') return -1;
          if (b.lastActive === 'Online now' && a.lastActive !== 'Online now') return 1;
          return 0;
        case 'looma_cells':
        default:
          return (b.looma_cells || 0) - (a.looma_cells || 0);
      }
    });

  const performSearch = (query: string) => {
    const lowerQuery = query.toLowerCase();

    const filtered = allUsers.filter(user =>
      (user.full_name?.toLowerCase() || '').includes(lowerQuery) ||
      (user.email?.toLowerCase() || '').includes(lowerQuery) ||
      (user.school_name?.toLowerCase() || '').includes(lowerQuery)
    );

    setSearchResults(filtered);
    setIsSearching(true);
  };

  const handleSendFriendRequest = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: userId,
          status: 'pending'
        });

      if (error) throw error;

      // Update local state
      setAllUsers(prev => 
        prev.map(u => 
          u.id === userId 
            ? { 
                ...u, 
                friendshipStatus: { 
                  status: 'pending_sent',
                  friendshipId: u.id // This is temporary, will be replaced with actual ID on refresh
                }
              }
            : u
        )
      );

      Alert.alert(
        '🎉 Friend Request Sent!',
        `Your friend request has been sent!`,
        [{ text: 'Great!', style: 'default' }]
      );
      
      // Refresh data to get the actual friendship ID
      fetchUsers();
    } catch (error: any) {
      console.error('Error sending friend request:', error.message);
      Alert.alert('Error', 'Failed to send friend request. Please try again.');
    }
  };

  const handleAcceptFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;

      // Update local state
      setAllUsers(prev => 
        prev.map(u => 
          u.friendshipStatus.friendshipId === friendshipId
            ? { 
                ...u, 
                friendshipStatus: { 
                  status: 'accepted',
                  friendshipId
                }
              }
            : u
        )
      );
      
      // Update following list
      const updatedUser = allUsers.find(u => u.friendshipStatus.friendshipId === friendshipId);
      if (updatedUser) {
        const updatedUserWithAccepted = {
          ...updatedUser,
          friendshipStatus: {
            status: 'accepted',
            friendshipId
          }
        };
        setFollowingList(prev => [...prev, updatedUserWithAccepted]);
      }

      Alert.alert(
        '🎉 Friend Request Accepted!',
        `You are now friends!`,
        [{ text: 'Great!', style: 'default' }]
      );
    } catch (error: any) {
      console.error('Error accepting friend request:', error.message);
      Alert.alert('Error', 'Failed to accept friend request. Please try again.');
    }
  };

  const handleRejectFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      // Update local state
      setAllUsers(prev => 
        prev.map(u => 
          u.friendshipStatus.friendshipId === friendshipId
            ? { 
                ...u, 
                friendshipStatus: { 
                  status: 'not_connected'
                }
              }
            : u
        )
      );

      Alert.alert(
        'Friend Request Rejected',
        `The friend request has been rejected.`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      console.error('Error rejecting friend request:', error.message);
      Alert.alert('Error', 'Failed to reject friend request. Please try again.');
    }
  };

  const handleUnfriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      // Update local state
      const userToRemove = allUsers.find(u => u.friendshipStatus.friendshipId === friendshipId);
      
      setAllUsers(prev => 
        prev.map(u => 
          u.friendshipStatus.friendshipId === friendshipId
            ? { 
                ...u, 
                friendshipStatus: { 
                  status: 'not_connected'
                }
              }
            : u
        )
      );
      
      // Remove from following list
      setFollowingList(prev => prev.filter(u => u.friendshipStatus.friendshipId !== friendshipId));

      if (userToRemove) {
        Alert.alert(
          'Unfriended',
          `You've unfollowed ${userToRemove.full_name}.`,
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error: any) {
      console.error('Error unfriending:', error.message);
      Alert.alert('Error', 'Failed to unfriend. Please try again.');
    }
  };

  const handleCancelRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      // Update local state
      setAllUsers(prev => 
        prev.map(u => 
          u.friendshipStatus.friendshipId === friendshipId
            ? { 
                ...u, 
                friendshipStatus: { 
                  status: 'not_connected'
                }
              }
            : u
        )
      );

      Alert.alert(
        'Request Cancelled',
        `Your friend request has been cancelled.`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error: any) {
      console.error('Error cancelling request:', error.message);
      Alert.alert('Error', 'Failed to cancel request. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleUserProfile = (userItem: UserWithFriendship) => {
    Alert.alert(
      `${userItem.full_name}'s Profile`,
      `School: ${userItem.school_name || 'Unknown School'}\nGrade: ${userItem.grade || 'Unknown Grade'}\nRegion: ${userItem.region || 'Unknown'}\nLooma Cells: ${userItem.looma_cells?.toLocaleString() || 0}\nStreak: ${userItem.day_streak || 0} days\nSubjects: ${userItem.subjects?.join(', ') || 'N/A'}\nLast Active: ${userItem.lastActive || 'N/A'}${userItem.mutualFriends ? `\nMutual Friends: ${userItem.mutualFriends}` : ''}`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Message',
          style: 'default',
          onPress: () => {
            Alert.alert('Message', `Messaging feature would open here to chat with ${userItem.full_name}.`);
          }
        }
      ]
    );
  };

  const renderFriendActionButton = (userItem: UserWithFriendship) => {
    const { friendshipStatus } = userItem;

    switch (friendshipStatus.status) {
      case 'not_connected':
        return (
          <TouchableOpacity
            style={styles.followButton}
            onPress={() => handleSendFriendRequest(userItem.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add" size={16} color={theme.colors.base} />
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        );
      case 'pending_sent':
        return (
          <TouchableOpacity
            style={[styles.followButton, styles.pendingButton]}
            onPress={() => handleCancelRequest(friendshipStatus.friendshipId!)}
            activeOpacity={0.8}
          >
            <Ionicons name="time" size={16} color={theme.colors.base} />
            <Text style={styles.followButtonText}>Pending</Text>
          </TouchableOpacity>
        );
      case 'pending_received':
        return (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptFriendRequest(friendshipStatus.friendshipId!)}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={16} color={theme.colors.base} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectFriendRequest(friendshipStatus.friendshipId!)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={16} color={theme.colors.base} />
            </TouchableOpacity>
          </View>
        );
      case 'accepted':
        return (
          <TouchableOpacity
            style={[styles.followButton, styles.followingButton]}
            onPress={() => handleUnfriend(friendshipStatus.friendshipId!)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.base} />
            <Text style={styles.followingButtonText}>Following</Text>
          </TouchableOpacity>
        );
      case 'blocked':
        return (
          <TouchableOpacity
            style={[styles.followButton, styles.blockedButton]}
            onPress={() => handleUnfriend(friendshipStatus.friendshipId!)}
            activeOpacity={0.8}
          >
            <Ionicons name="ban" size={16} color={theme.colors.base} />
            <Text style={styles.followButtonText}>Blocked</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  const renderUserCard = ({ item }: { item: UserWithFriendship }) => (
    <TouchableOpacity
      style={[
        styles.userCard,
        item.friendshipStatus.status === 'accepted' && styles.followingUserCard
      ]}
      activeOpacity={0.8}
      onPress={() => handleUserProfile(item)}
    >
      {/* Profile Image with Online Status */}
      <View style={styles.profileImageContainer}>
        <Image 
          source={{ uri: item.profile_image || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop' }}
          style={[
            styles.profileImage,
            item.friendshipStatus.status === 'accepted' && styles.followingProfileImage
          ]}
        />
        {item.lastActive === 'Online now' && (
          <View style={styles.onlineIndicator} />
        )}
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={[
            styles.userName,
            item.friendshipStatus.status === 'accepted' && styles.followingUserName
          ]} numberOfLines={1}>
            {item.full_name || 'Anonymous User'}
          </Text>
          {item.friendshipStatus.status === 'accepted' && (
            <View style={styles.followingBadge}>
              <Ionicons name="heart" size={12} color={theme.colors.accent} />
            </View>
          )}
        </View>
        
        <Text style={styles.userUsername} numberOfLines={1}>@{item.email?.split('@')[0] || 'user'}</Text>
        <Text style={styles.userSchool} numberOfLines={1}>{item.school_name || 'Unknown School'}</Text>
        
        <View style={styles.userStats}>
          <View style={styles.statItem}>
            <Ionicons name="bulb" size={14} color={theme.colors.accent} />
            <Text style={styles.statText}>{item.looma_cells?.toLocaleString() || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="flame" size={14} color="#FF6B35" />
            <Text style={styles.statText}>{item.day_streak || 0}d</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="location" size={14} color={theme.colors.primary} />
            <Text style={styles.statText}>{item.region}</Text>
          </View>
        </View>

        <View style={styles.userMeta}>
          <Text style={styles.lastActiveText}>{item.lastActive}</Text>
          {item.mutualFriends > 0 && (
            <Text style={styles.mutualFriendsText}>
              {item.mutualFriends} mutual friend{item.mutualFriends > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>

      {/* Friend Action Button */}
      {renderFriendActionButton(item)}
    </TouchableOpacity>
  );

  const renderEmptySearch = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color={theme.colors.primary} />
      <Text style={styles.emptyStateTitle}>
        {searchQuery.trim() ? 'No users found' : 'Discover Friends'}
      </Text>
      <Text style={styles.emptyStateText}>
        {searchQuery.trim() 
          ? 'Try searching with a different username, email, or school name'
          : 'Search by username, email, or school to discover other Looma learners in your area'
        }
      </Text>
    </View>
  );

  const renderEmptyFollowing = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={theme.colors.primary} />
      <Text style={styles.emptyStateTitle}>No friends yet</Text>
      <Text style={styles.emptyStateText}>
        Start following other learners to see their activity and progress here. Connect with classmates and study buddies!
      </Text>
      <TouchableOpacity 
        style={styles.discoverButton}
        onPress={() => setActiveTab('discover')}
        activeOpacity={0.8}
      >
        <Ionicons name="search" size={16} color={theme.colors.base} />
        <Text style={styles.discoverButtonText}>Discover Friends</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <Ionicons name="people" size={64} color={theme.colors.primary} />
      <Text style={styles.loadingText}>Loading friends...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
      <Text style={styles.errorTitle}>Couldn't load friends</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={onRefresh}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh" size={16} color={theme.colors.base} />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="filter-outline" size={20} color={theme.colors.secondary} />
          </TouchableOpacity>
          <View style={styles.headerStats}>
            <Text style={styles.headerStatsText}>
              {followingList.length} following
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'discover' && styles.activeTab
          ]}
          onPress={() => setActiveTab('discover')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="search" 
            size={18} 
            color={activeTab === 'discover' ? theme.colors.base : theme.colors.secondary} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'discover' && styles.activeTabText
          ]}>
            Discover
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'following' && styles.activeTab
          ]}
          onPress={() => setActiveTab('following')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="people" 
            size={18} 
            color={activeTab === 'following' ? theme.colors.base : theme.colors.secondary} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'following' && styles.activeTabText
          ]}>
            Following
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar (only for discover tab) */}
      {activeTab === 'discover' && (
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email or school"
              placeholderTextColor={`${theme.colors.secondary}60`}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isSearching && (
              <View style={styles.searchLoader}>
                <Text style={styles.searchLoaderText}>...</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Active Filters */}
      {(selectedRegion !== 'All' || selectedGrade !== 'All') && (
        <View style={styles.activeFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterChips}>
              {selectedRegion !== 'All' && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>{selectedRegion}</Text>
                  <TouchableOpacity onPress={() => setSelectedRegion('All')}>
                    <Ionicons name="close" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {selectedGrade !== 'All' && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>{selectedGrade}</Text>
                  <TouchableOpacity onPress={() => setSelectedGrade('All')}>
                    <Ionicons name="close" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Friends List */}
      {isLoading && !refreshing ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.usersList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={activeTab === 'discover' ? renderEmptySearch : renderEmptyFollowing}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Region Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Region</Text>
                <View style={styles.filterOptions}>
                  {regions.map((region) => (
                    <TouchableOpacity
                      key={region}
                      style={[
                        styles.filterOption,
                        selectedRegion === region && styles.selectedFilterOption
                      ]}
                      onPress={() => setSelectedRegion(region)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedRegion === region && styles.selectedFilterOptionText
                      ]}>
                        {region}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Grade Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Grade</Text>
                <View style={styles.filterOptions}>
                  {grades.map((grade) => (
                    <TouchableOpacity
                      key={grade}
                      style={[
                        styles.filterOption,
                        selectedGrade === grade && styles.selectedFilterOption
                      ]}
                      onPress={() => setSelectedGrade(grade)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedGrade === grade && styles.selectedFilterOptionText
                      ]}>
                        {grade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sort Options */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sort By</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'looma_cells', label: 'Looma Cells' },
                    { key: 'full_name', label: 'Name' },
                    { key: 'activity', label: 'Activity' }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOption,
                        sortBy === option.key && styles.selectedFilterOption
                      ]}
                      onPress={() => setSortBy(option.key as any)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        sortBy === option.key && styles.selectedFilterOptionText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={styles.applyFiltersButton}
              onPress={() => setShowFilterModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.applyFiltersText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
  },
  headerStats: {
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerStatsText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceLight,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  activeTabText: {
    color: theme.colors.base,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
  },
  searchLoader: {
    marginLeft: 8,
  },
  searchLoaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  activeFilters: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  usersList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}08`,
  },
  followingUserCard: {
    backgroundColor: `${theme.colors.primary}08`,
    borderColor: `${theme.colors.primary}20`,
    shadowOpacity: 0.15,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.base,
  },
  followingProfileImage: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: theme.colors.base,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
    flex: 1,
  },
  followingUserName: {
    color: theme.colors.primary,
  },
  followingBadge: {
    marginLeft: 8,
  },
  userUsername: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.6,
    marginBottom: 2,
  },
  userSchool: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    marginBottom: 8,
  },
  userStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastActiveText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.6,
  },
  mutualFriendsText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  followingButton: {
    backgroundColor: theme.colors.accent,
  },
  pendingButton: {
    backgroundColor: theme.colors.warning,
  },
  blockedButton: {
    backgroundColor: theme.colors.error,
  },
  followButtonText: {
    color: theme.colors.base,
    fontSize: 12,
    fontWeight: '700',
  },
  followingButtonText: {
    color: theme.colors.base,
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: theme.colors.success,
  },
  rejectButton: {
    backgroundColor: theme.colors.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  discoverButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  retryButtonText: {
    color: theme.colors.base,
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
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
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFilterOption: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.secondary,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  selectedFilterOptionText: {
    color: theme.colors.base,
  },
  applyFiltersButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  applyFiltersText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '700',
  },
});