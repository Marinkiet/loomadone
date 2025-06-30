import React, { useState, useRef, useEffect } from 'react';

import { 
  View, 
  Text, 
  StyleSheet,
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  Modal,
  Alert,
  Animated,
  Image,
  ActivityIndicator
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { theme } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { useSubjects } from '@/hooks/useSubjects';
import { useTavus } from '@/hooks/useTavus';
import { useStripe } from '@/hooks/useStripe';
import styled from 'styled-components/native';
import TavusCallModal from '@/components/TavusCallModal';
import SubscriptionModal from '@/components/SubscriptionModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Styled Components for the new design
const FixedBackground = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.backgroundColor || '#2D1B69'};
  z-index: 0;
`;

const ScrollableContainer = styled.View`
  flex: 1;
  z-index: 1;
`;

const SubtopicMarker = styled.TouchableOpacity`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: ${props => props.statusColor || theme.colors.primary};
  align-items: center;
  justify-content: center;
  margin: 20px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 8;
  border-width: 3px;
  border-color: ${theme.colors.base};
  position: relative;
`;

const SubtopicLabel = styled.Text`
  font-size: 14px;
  font-weight: 700;
  color: ${theme.colors.secondary};
  text-align: center;
  margin-top: 8px;
  max-width: 120px;
`;

const PulseRing = styled(Animated.View)`
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  border-radius: 68px;
  border-width: 2px;
  border-color: ${theme.colors.primary};
`;

const ProgressRing = styled.View`
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border-radius: 63px;
  border-width: 3px;
  border-color: rgba(255, 255, 255, 0.3);
  overflow: hidden;
`;

const ProgressFill = styled.View`
  width: ${props => props.progress || '0%'};
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
`;

// Default fallback map for subjects not in the database
const defaultMap = {
  mapName: 'Learning Landscape',
  backgroundColor: '#3D2B1F',
  subtopics: []
};

// Subject color mapping
const getSubjectColor = (subjectName: string) => {
  const colorMap: { [key: string]: string } = {
    'Mathematics': '#8B5CF6',
    'Mathematical Literacy': '#7C3AED',
    'Life Sciences': '#10B981',
    'Natural Sciences': '#10B981',
    'English Home Language': '#3B82F6',
    'Physical Sciences': '#F59E0B',
    'Afrikaans First Additional Language': '#F59E0B',
    'Business Studies': '#059669',
    'Life Orientation': '#DC2626',
    'Geography': '#059669',
    'History': '#6366F1',
    'Economics': '#0891B2',
    'Accounting': '#EF4444',
    'Technology': '#0891B2',
    'Computer Applications Technology': '#0891B2',
    'Information Technology': '#7C3AED',
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
  return colorMap[subjectName] || theme.colors.primary;
};

export default function LoomaLandScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { subjects, topics, userProgress, isLoading: subjectsLoading, fetchSubjects } = useSubjects();
  const { startTutorCall, isLoading: tavusLoading, callUrl, clearCall } = useTavus();
  const { isSubscribed } = useStripe();
  
  const [selectedSubject, setSelectedSubject] = useState(params.subject as string || '');
  const [currentMap, setCurrentMap] = useState(defaultMap);
  const [showSubtopicModal, setShowSubtopicModal] = useState<any>(null);
  const [showSubjectSelector, setShowSubjectSelector] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  const spriteAnim = useRef(new Animated.Value(0)).current;

  // Get user's subjects from the database
  const userSubjects = user?.subjects || [];

  // Set default subject if none is selected
  useEffect(() => {
    if (!selectedSubject && userSubjects.length > 0) {
      setSelectedSubject(userSubjects[0]);
    }
  }, [userSubjects, selectedSubject]);

  // Generate current map based on selected subject and database data
  useEffect(() => {
    if (!selectedSubject || subjectsLoading) return;

    // Find the subject in the database
    const subject = subjects.find(s => s.name === selectedSubject);
    
    if (subject && topics[subject.id]) {
      // Get topics for this subject
      const subjectTopics = topics[subject.id];
      
      // Convert database topics to map format
      const mapSubtopics = subjectTopics.map(topic => {
        // Find user progress for this topic
        const progress = userProgress.find(p => p.topic_id === topic.id);
        
        return {
          id: topic.id,
          title: topic.title,
          name: topic.name,
          status: progress?.status || topic.status || 'locked',
          greeting: `🎯 Welcome to ${topic.name}!`,
          description: topic.description || `Explore ${topic.title} and master new concepts!`,
          subtopicKey: topic.subtopic_key,
          position_x: topic.position_x,
          position_y: topic.position_y,
          progress_percentage: progress?.progress_percentage || 0,
        };
      });

      setCurrentMap({
        mapName: `${subject.name} Adventure`,
        backgroundColor: subject.color || getSubjectColor(subject.name),
        subtopics: mapSubtopics,
      });
    } else {
      // Fallback for subjects not in database or without topics
      setCurrentMap({
        mapName: selectedSubject ? `${selectedSubject} Adventure` : 'Learning Landscape',
        backgroundColor: getSubjectColor(selectedSubject),
        subtopics: [],
      });
    }
  }, [selectedSubject, subjects, topics, userProgress, subjectsLoading]);

  // Animate pulse for available topics
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(spriteAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(spriteAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#F59E0B';
      case 'not_started': return theme.colors.primary;
      case 'locked': return '#6B7280';
      default: return theme.colors.primary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'in_progress': return 'play-circle';
      case 'not_started': return 'radio-button-off';
      case 'locked': return 'lock-closed';
      default: return 'radio-button-off';
    }
  };

  const handleSubtopicPress = (subtopic: any) => {
    if (subtopic.status === 'locked') {
      Alert.alert(
        '🔒 Locked Content',
        'Complete previous topics to unlock this area!',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    setShowSubtopicModal(subtopic);
  };

  const handleProceedToGames = () => {
    if (showSubtopicModal) {
      setShowSubtopicModal(null);
      // Navigate to game cards with subtopic data including the topic ID (UUID)
      router.push({
        pathname: '/game-cards',
        params: {
          subtopic: showSubtopicModal.subtopicKey,
          subtopicName: showSubtopicModal.name,
          subject: selectedSubject,
          topicId: showSubtopicModal.id // Pass the actual UUID of the topic
        }
      });
    }
  };

  const handleJoinCall = async () => {
    if (showSubtopicModal) {
      // Check if user is subscribed
      if (!isSubscribed) {
        setShowSubscriptionModal(true);
      } else {
        try {
          const url = await startTutorCall(
            showSubtopicModal.title,
            user?.full_name || 'Student'
          );
          
          if (url) {
            setShowCallModal(true);
            setShowSubtopicModal(null);
          }
        } catch (error) {
          console.error('Error starting tutor call:', error);
        }
      }
    }
  };

  const handleCloseCall = () => {
    setShowCallModal(false);
    clearCall();
  };

  const handleVisitLoomaLand = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://aikwetu-3.vercel.app/');
    } catch (error) {
      Alert.alert('Error', 'Could not open LoomaLand');
    }
  };

  const renderSubtopicMarker = (subtopic: any, index: number) => {
    const statusColor = getStatusColor(subtopic.status);
    const statusIcon = getStatusIcon(subtopic.status);
   

    return (
      <View key={subtopic.id} style={styles.subtopicContainer}>
        <SubtopicMarker
          statusColor={statusColor}
          onPress={() => handleSubtopicPress(subtopic)}
          activeOpacity={0.8}
        >
          <Ionicons name={statusIcon as any} size={32} color={theme.colors.base} />
          
          {/* Progress indicator for in-progress topics */}
          {subtopic.status === 'in_progress' && (
            <ProgressRing>
              <ProgressFill progress={`${subtopic.progress_percentage || 0}%`} />
            </ProgressRing>
          )}
          
          {/* Pulsing animation for available topics */}
          {subtopic.status === 'not_started' && (
            <PulseRing style={{
              opacity: spriteAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
              transform: [{
                scale: spriteAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                })
              }]
            }} />
          )}
        </SubtopicMarker>
        
        <SubtopicLabel style={styles.subtopicTitle}>{subtopic.name}</SubtopicLabel>
      </View>
    );
  };

  // Show loading state
  if (subjectsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <FixedBackground backgroundColor={currentMap.backgroundColor} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.base} />
          <Text style={styles.loadingText}>Loading your learning adventure...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Background */}
      <FixedBackground backgroundColor={currentMap.backgroundColor} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.base} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.title}>LoomaLand</Text>
          <Text style={styles.subtitle}>{currentMap.mapName}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.subjectButton}
          onPress={() => setShowSubjectSelector(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-horizontal" size={20} color={theme.colors.base} />
        </TouchableOpacity>
      </View>

      {/* Progress Indicators */}
      <View style={styles.progressIndicators}>
        <View style={styles.progressItem}>
          <View style={[styles.progressDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.progressText}>Completed</Text>
        </View>
        <View style={styles.progressItem}>
          <View style={[styles.progressDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.progressText}>In Progress</Text>
        </View>
        <View style={styles.progressItem}>
          <View style={[styles.progressDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={styles.progressText}>Available</Text>
        </View>
        <View style={styles.progressItem}>
          <View style={[styles.progressDot, { backgroundColor: '#6B7280' }]} />
          <Text style={styles.progressText}>Locked</Text>
        </View>
      </View>

      {/* Scrollable Subtopics Container */}
      <ScrollableContainer>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {currentMap.subtopics.length > 0 ? (
            currentMap.subtopics.map(renderSubtopicMarker)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="construct-outline" size={64} color={theme.colors.base} />
              <Text style={styles.emptyStateTitle}>Coming Soon!</Text>
              <Text style={styles.emptyStateText}>
                Topics for {selectedSubject} are being prepared. Check back soon for exciting learning adventures!
              </Text>
            </View>
          )}
        </ScrollView>
      </ScrollableContainer>

      {/* Subject Selector Modal */}
      <Modal
        visible={showSubjectSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubjectSelector(false)}
      >
        <ScrollView>
        <View style={styles.modalOverlay}>
        
          <View style={styles.subjectSelectorModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subject</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowSubjectSelector(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.subjectList} showsVerticalScrollIndicator={false}>
              {userSubjects && userSubjects.length > 0 ? (
                userSubjects.map((subject) => (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.subjectOption,
                      selectedSubject === subject && styles.selectedSubjectOption
                    ]}
                    onPress={() => {
                      setSelectedSubject(subject);
                      setShowSubjectSelector(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.subjectOptionText,
                      selectedSubject === subject && styles.selectedSubjectOptionText
                    ]}>
                      {subject}
                    </Text>
                    {selectedSubject === subject && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noSubjectsContainer}>
                  <Ionicons name="alert-circle-outline" size={48} color={theme.colors.primary} />
                  <Text style={styles.noSubjectsText}>
                    No subjects found in your profile
                  </Text>
                  <TouchableOpacity 
                    style={styles.editProfileButton}
                    onPress={() => {
                      setShowSubjectSelector(false);
                      router.push('/edit-profile');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editProfileButtonText}>Update Profile</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
      </Modal>

      {/* Subtopic Modal */}
      <Modal
        visible={!!showSubtopicModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubtopicModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.subtopicModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalGreeting}>
                {showSubtopicModal?.greeting}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowSubtopicModal(null)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>{showSubtopicModal?.title}</Text>
              <Text style={styles.modalTitle}>{showSubtopicModal?.name}</Text>
              <Text style={styles.modalDescription}>
                {showSubtopicModal?.description}
              </Text>
              
              {/* Learning Options */}
              <View style={styles.learningOptionsContainer}>
                <Text style={styles.learningOptionsTitle}>Choose Your Learning Path:</Text>
                
                <TouchableOpacity 
                  style={styles.learningOptionButton}
                  onPress={handleProceedToGames}
                  activeOpacity={0.8}
                >
                  <Ionicons name="library" size={20} color={theme.colors.base} />
                  <View style={styles.learningOptionContent}>
                    <Text style={styles.learningOptionButtonText}>Interactive Games</Text>
                    <Text style={styles.learningOptionSubtext}>Learn through fun card-based games</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.learningOptionButton, styles.callOptionButton]}
                  onPress={handleJoinCall}
                  activeOpacity={0.8}
                >
                  <Ionicons name="videocam" size={20} color={theme.colors.base} />
                  <View style={styles.learningOptionContent}>
                    <Text style={styles.learningOptionButtonText}>Join AI Tutor Call</Text>
                    <Text style={styles.learningOptionSubtext}>Get personalized help from an AI tutor</Text>
                  </View>
                 
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.learningOptionButton, styles.LoomaLandButton]}
                  onPress={handleVisitLoomaLand}
                  activeOpacity={0.8}
                >
                  <Ionicons name="globe" size={20} color={theme.colors.base} />
                  <View style={styles.learningOptionContent}>
                    <Text style={styles.learningOptionButtonText}>Visit LoomaLand</Text>
                    <Text style={styles.learningOptionSubtext}>2D Adventure fun land</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        context="tutor"
      />

      {/* Tavus Call Modal */}
      <TavusCallModal
        visible={showCallModal}
        callUrl={callUrl}
        topicName={showSubtopicModal?.title || 'Learning Session'}
        onClose={handleCloseCall}
        isLoading={tavusLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.base,
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.base,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.base,
    marginTop: 2,
    opacity: 0.9,
  },
  subjectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 2,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.base,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  subtopicContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtopicTitle:{
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.base,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.base,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.base,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtopicModal: {
    backgroundColor: theme.colors.base,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  subjectSelectorModal: {
    backgroundColor: theme.colors.base,
    borderRadius: 20,
    padding: 24,
    width: screenWidth * 0.9,
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.secondary,
  },
  modalGreeting: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
    flex: 1,
    lineHeight: 24,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
    marginLeft: 12,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    opacity: 0.8,
  },
  subjectList: {
    flex: 1,
    marginTop: 16,
  },
  subjectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSubjectOption: {
    backgroundColor: `${theme.colors.primary}15`,
    borderColor: theme.colors.primary,
  },
  subjectOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  selectedSubjectOptionText: {
    color: theme.colors.primary,
  },
  noSubjectsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  noSubjectsText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  editProfileButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  editProfileButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '600',
  },
  learningOptionsContainer: {
    width: '100%',
    gap: 12,
  },
  learningOptionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  learningOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  callOptionButton: {
    backgroundColor: '#10B981', // Green color for video call
  },
  LoomaLandButton: {
    backgroundColor: '#3B82F6', // Blue color for loomaland
  },
  learningOptionContent: {
    flex: 1,
  },
  learningOptionButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  learningOptionSubtext: {
    color: theme.colors.base,
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
  premiumBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: theme.colors.base,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
});