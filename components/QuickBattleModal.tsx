import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { useGameQuestions } from '@/hooks/useGameQuestions';
import { useElevenLabs } from '@/hooks/useElevenLabs';
import { useStripe } from '@/hooks/useStripe';
import { router } from 'expo-router';

// Mock friends data
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

interface QuickBattleModalProps {
  visible: boolean;
  onClose: () => void;
  onBattleStart: (opponent: any, subject: string) => void;
}

export default function QuickBattleModal({
  visible,
  onClose,
  onBattleStart
}: QuickBattleModalProps) {
  const { user } = useAuth();
  const { isSubscribed } = useStripe();
  const { userStats } = useGameQuestions();
  const { speakText, isNarratorEnabled } = useElevenLabs();
  
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'select-friend' | 'select-subject' | 'confirm'>('select-friend');
  
  // Get user's subjects
  const userSubjects = user?.subjects || [];
  
  // Reset state when modal is opened
  useEffect(() => {
    if (visible) {
      setSelectedFriend(null);
      setSelectedSubject(null);
      setStep('select-friend');
    }
  }, [visible]);
  
  const handleFriendSelect = (friendId: string) => {
    setSelectedFriend(friendId);
    setStep('select-subject');
  };
  
  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setStep('confirm');
  };
  
  const handleStartBattle = async () => {
    if (!selectedFriend || !selectedSubject) return;
    
    // Speak battle announcement if narrator is enabled
    if (isNarratorEnabled) {
      const opponent = mockFriends.find(f => f.id === selectedFriend)?.name.split(' ')[0] || 'opponent';
      const battleAnnouncements = [
        `Starting battle in ${selectedSubject} against ${opponent}!`,
        `Get ready for an epic ${selectedSubject} showdown with ${opponent}!`,
        `${selectedSubject} battle beginning! You versus ${opponent}!`,
        `Prepare for your ${selectedSubject} challenge against ${opponent}!`,
        `It's time to test your ${selectedSubject} knowledge against ${opponent}!`
      ];
      speakText(battleAnnouncements[Math.floor(Math.random() * battleAnnouncements.length)]);
    }
    
    setIsLoading(true);
    
    try {
      // Get selected friend
      const opponent = mockFriends.find(f => f.id === selectedFriend);
      
      if (!opponent) {
        throw new Error('Selected friend not found');
      }
      
      // Close modal and start battle
      onClose();
      onBattleStart(opponent, selectedSubject);
      
      // Navigate to battle screen
      router.push({
        pathname: '/battle',
        params: {
          opponentId: opponent.id,
          subject: selectedSubject
        }
      });
    } catch (error) {
      console.error('Error starting battle:', error);
      Alert.alert('Error', 'Failed to start battle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderFriendsList = () => (
    <View style={styles.friendsListContainer}>
      <Text style={styles.sectionTitle}>Challenge a Friend</Text>
      <Text style={styles.sectionSubtitle}>Select a friend to battle with</Text>
      
      <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
        {mockFriends.map(friend => (
          <TouchableOpacity
            key={friend.id}
            style={styles.friendItem}
            onPress={() => handleFriendSelect(friend.id)}
            activeOpacity={0.7}
          >
            <View style={styles.friendInfo}>
              <Image 
                source={{ uri: friend.profileImage }}
                style={styles.friendAvatar}
              />
              <View style={styles.friendDetails}>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Text style={styles.friendUsername}>@{friend.username}</Text>
                <Text style={styles.friendLevel}>{friend.level}</Text>
              </View>
            </View>
            
            <View style={styles.friendStats}>
              <View style={styles.pointsContainer}>
                <Ionicons name="bulb" size={14} color={theme.colors.accent} />
                <Text style={styles.pointsText}>{friend.points}</Text>
              </View>
              
              <View style={[
                styles.statusIndicator,
                friend.online ? styles.onlineIndicator : styles.offlineIndicator
              ]}>
                <Text style={styles.statusText}>
                  {friend.online ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
  
  const renderSubjectSelection = () => {
    const selectedFriendData = mockFriends.find(f => f.id === selectedFriend);
    
    return (
      <View style={styles.subjectSelectionContainer}>
        <View style={styles.selectedFriendHeader}>
          <Image 
            source={{ uri: selectedFriendData?.profileImage }}
            style={styles.selectedFriendAvatar}
          />
          <Text style={styles.selectedFriendName}>
            Battle with {selectedFriendData?.name}
          </Text>
        </View>
        
        <Text style={styles.sectionTitle}>Choose a Subject</Text>
        <Text style={styles.sectionSubtitle}>Select a subject for your battle</Text>
        
        <ScrollView style={styles.subjectsList} showsVerticalScrollIndicator={false}>
          {userSubjects && userSubjects.length > 0 ? (
            userSubjects.map((subject, index) => (
              <TouchableOpacity
                key={index}
                style={styles.subjectItem}
                onPress={() => handleSubjectSelect(subject)}
                activeOpacity={0.7}
              >
                <Text style={styles.subjectName}>{subject}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.secondary} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noSubjectsContainer}>
              <Ionicons name="alert-circle" size={48} color={theme.colors.primary} />
              <Text style={styles.noSubjectsText}>
                No subjects found in your profile
              </Text>
              <TouchableOpacity
                style={styles.updateProfileButton}
                onPress={() => {
                  onClose();
                  router.push('/edit-profile');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.updateProfileButtonText}>Update Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('select-friend')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.secondary} />
          <Text style={styles.backButtonText}>Back to Friends</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderConfirmation = () => {
    const selectedFriendData = mockFriends.find(f => f.id === selectedFriend);
    
    return (
      <View style={styles.confirmationContainer}>
        <Text style={styles.confirmationTitle}>Ready to Battle?</Text>
        
        <View style={styles.battlePreview}>
          {/* Player 1 */}
          <View style={styles.playerContainer}>
            <Image 
              source={{ uri: user?.profile_image || 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&fit=crop' }}
              style={styles.playerImage}
            />
            <Text style={styles.playerName}>{user?.full_name?.split(' ')[0] || 'You'}</Text>
            <View style={styles.playerStats}>
              <Ionicons name="bulb" size={14} color={theme.colors.accent} />
              <Text style={styles.playerStatsText}>{user?.looma_cells || 0}</Text>
            </View>
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
              source={{ uri: selectedFriendData?.profileImage }}
              style={styles.playerImage}
            />
            <Text style={styles.playerName}>{selectedFriendData?.name.split(' ')[0]}</Text>
            <View style={styles.playerStats}>
              <Ionicons name="bulb" size={14} color={theme.colors.accent} />
              <Text style={styles.playerStatsText}>{selectedFriendData?.points}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.battleDetails}>
          <View style={styles.battleDetailItem}>
            <Text style={styles.battleDetailLabel}>Subject:</Text>
            <Text style={styles.battleDetailValue}>{selectedSubject}</Text>
          </View>
          
          <View style={styles.battleDetailItem}>
            <Text style={styles.battleDetailLabel}>Battle Type:</Text>
            <Text style={styles.battleDetailValue}>Quick Battle (5 questions)</Text>
          </View>
          
          <View style={styles.battleDetailItem}>
            <Text style={styles.battleDetailLabel}>Reward:</Text>
            <View style={styles.rewardContainer}>
              <Text style={styles.battleDetailValue}>
                {isSubscribed ? '20' : '10'} Looma Cells
              </Text>
              {isSubscribed && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>2x</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.confirmationActions}>
          <TouchableOpacity
            style={styles.startBattleButton}
            onPress={handleStartBattle}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.base} />
            ) : (
              <>
                <Ionicons name="flash" size={20} color={theme.colors.base} />
                <Text style={styles.startBattleButtonText}>Start Battle</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('select-subject')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={theme.colors.secondary} />
            <Text style={styles.backButtonText}>Change Subject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
       
        <View style={styles.modalContent}>
           <ScrollView style={styles.summaryContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>⚔️ Quick Battle</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={theme.colors.secondary} />
            </TouchableOpacity>
          </View>
          
          {/* Content based on current step */}
          {step === 'select-friend' && renderFriendsList()}
          {step === 'select-subject' && renderSubjectSelection()}
          {step === 'confirm' && renderConfirmation()}
               </ScrollView>
        </View>
      
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  // Friends List Styles
  friendsListContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    marginBottom: 16,
  },
  friendsList: {
    maxHeight: 400,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    marginBottom: 2,
  },
  friendLevel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  friendStats: {
    alignItems: 'flex-end',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  onlineIndicator: {
    backgroundColor: `${theme.colors.success}15`,
  },
  offlineIndicator: {
    backgroundColor: `${theme.colors.secondary}15`,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  // Subject Selection Styles
  subjectSelectionContainer: {
    flex: 1,
  },
  selectedFriendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  selectedFriendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  selectedFriendName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  subjectsList: {
    maxHeight: 300,
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  noSubjectsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSubjectsText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  updateProfileButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  updateProfileButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  // Confirmation Styles
  confirmationContainer: {
    flex: 1,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  battlePreview: {
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
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  playerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerStatsText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  vsContainer: {
    paddingHorizontal: 16,
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
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.base,
  },
  battleDetails: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  battleDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  battleDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  battleDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  confirmationActions: {
    gap: 12,
  },
  startBattleButton: {
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
  startBattleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.base,
  },
});