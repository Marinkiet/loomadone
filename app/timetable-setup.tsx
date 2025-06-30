import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  TextInput,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '@/theme';

const { width: screenWidth } = Dimensions.get('window');

// Mock user subscription status - in real app this would come from your auth/subscription system
const USER_IS_PRO = false; // Set to true to test pro features

// Sample subjects with colors
const availableSubjects = [
  { id: 'math', name: 'Mathematics', color: '#8B5CF6', icon: 'calculator' },
  { id: 'english', name: 'English', color: '#3B82F6', icon: 'book' },
  { id: 'science', name: 'Life Science', color: '#10B981', icon: 'leaf' },
  { id: 'physics', name: 'Physics', color: '#F59E0B', icon: 'planet' },
  { id: 'chemistry', name: 'Chemistry', color: '#EF4444', icon: 'flask' },
  { id: 'history', name: 'History', color: '#6366F1', icon: 'library' },
  { id: 'afrikaans', name: 'Afrikaans', color: '#EC4899', icon: 'language' },
  { id: 'business', name: 'Business Studies', color: '#059669', icon: 'briefcase' },
  { id: 'lo', name: 'Life Orientation', color: '#DC2626', icon: 'compass' },
  { id: 'ems', name: 'EMS', color: '#7C3AED', icon: 'stats-chart' },
  { id: 'tech', name: 'Technology', color: '#0891B2', icon: 'construct' },
  { id: 'break', name: 'Break', color: '#6B7280', icon: 'cafe' },
  { id: 'lunch', name: 'Lunch', color: '#6B7280', icon: 'restaurant' },
  { id: 'free', name: 'Free Period', color: '#9CA3AF', icon: 'time' },
];

// Default time slots
const defaultTimeSlots = [
  '07:30-08:30',
  '08:30-09:30',
  '09:30-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00'
];

// Sample Grade 8 timetable
const sampleTimetable = {
  'Monday': {
    '07:30-08:30': 'english',
    '08:30-09:30': 'math',
    '09:30-10:00': 'break',
    '10:00-11:00': 'science',
    '11:00-12:00': 'afrikaans',
    '12:00-13:00': 'tech',
  },
  'Tuesday': {
    '07:30-08:30': 'math',
    '08:30-09:30': 'history',
    '09:30-10:00': 'break',
    '10:00-11:00': 'math',
    '11:00-12:00': 'ems',
    '12:00-13:00': 'business',
  },
  'Wednesday': {
    '07:30-08:30': 'science',
    '08:30-09:30': 'english',
    '09:30-10:00': 'break',
    '10:00-11:00': 'history',
    '11:00-12:00': 'science',
    '12:00-13:00': 'tech',
  },
  'Thursday': {
    '07:30-08:30': 'afrikaans',
    '08:30-09:30': 'math',
    '09:30-10:00': 'break',
    '10:00-11:00': 'science',
    '11:00-12:00': 'english',
    '12:00-13:00': 'business',
  },
  'Friday': {
    '07:30-08:30': 'lo',
    '08:30-09:30': 'business',
    '09:30-10:00': 'break',
    '10:00-11:00': 'english',
    '11:00-12:00': 'lo',
    '12:00-13:00': 'free',
  }
};

export default function TimetableSetupScreen() {
  const [setupStep, setSetupStep] = useState<'type' | 'method' | 'manual' | 'camera' | 'review'>('type');
  const [timetableType, setTimetableType] = useState<'weekly' | 'rotating'>('weekly');
  const [setupMethod, setSetupMethod] = useState<'photo' | 'manual'>('manual');
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [timetableData, setTimetableData] = useState<any>({});
  const [timeSlots, setTimeSlots] = useState(defaultTimeSlots);
  const [selectedCell, setSelectedCell] = useState<{day: string, time: string} | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const [permission, requestPermission] = useCameraPermissions();

  const days = timetableType === 'weekly' 
    ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

  useEffect(() => {
    checkExistingTimetable();
  }, []);

  const checkExistingTimetable = async () => {
    try {
      const existing = await AsyncStorage.getItem('userTimetable');
      if (existing) {
        // User already has a timetable, go to edit mode
        router.replace('/timetable-edit');
      }
    } catch (error) {
      console.error('Error checking existing timetable:', error);
    }
  };

  const handleTypeSelection = (type: 'weekly' | 'rotating') => {
    setTimetableType(type);
    setSetupStep('method');
  };

  const handleMethodSelection = (method: 'photo' | 'manual') => {
    if (method === 'photo' && !USER_IS_PRO) {
      setShowUpgradeModal(true);
      return;
    }

    setSetupMethod(method);
    if (method === 'photo') {
      setSetupStep('camera');
    } else {
      // Load sample data for demonstration
      setTimetableData(sampleTimetable);
      setSetupStep('manual');
    }
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    Alert.alert(
      '🚀 Upgrade to Pro',
      'Pro features include:\n\n📸 OCR Timetable Scanning\n📊 Advanced Analytics\n🎨 Custom Themes\n☁️ Cloud Sync\n\nUpgrade now for just R29.99/month!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'Upgrade Now', 
          style: 'default',
          onPress: () => {
            // In a real app, this would open the subscription flow
            Alert.alert('Upgrade', 'Subscription flow would open here!');
          }
        }
      ]
    );
  };

  const handleAlternativeImageUpload = () => {
    setShowUpgradeModal(false);
    Alert.alert(
      '📱 Alternative Options',
      'While OCR scanning is a Pro feature, you can still:\n\n✍️ Enter your timetable manually\n📋 Copy from a template\n📝 Import from a text format\n\nWould you like to continue with manual entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Manual Entry', 
          style: 'default',
          onPress: () => handleMethodSelection('manual')
        }
      ]
    );
  };

  const handleCameraCapture = async () => {
    // This would only be called for Pro users
    if (!USER_IS_PRO) {
      Alert.alert('Pro Feature', 'Camera capture is only available for Pro users.');
      return;
    }

    if (Platform.OS === 'web') {
      // Web fallback for Pro users
      Alert.alert(
        'Upload Image',
        'In a real app, this would open a file picker for Pro users to upload their timetable image.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Simulate Upload', 
            onPress: () => {
              setCapturedImage('simulated-image-uri');
              setShowCamera(false);
              processOCR('simulated-image-uri');
            }
          }
        ]
      );
    } else {
      // Mobile camera capture for Pro users
      Alert.alert('Camera Capture', 'Camera capture functionality would be implemented here for Pro users on mobile platforms.');
    }
  };

  const processOCR = async (imageUri: string) => {
    setIsLoading(true);
    
    // Simulate OCR processing for Pro users
    setTimeout(() => {
      // For demo, we'll use the sample timetable
      setTimetableData(sampleTimetable);
      setIsLoading(false);
      setSetupStep('review');
      
      Alert.alert(
        '📸 OCR Processing Complete!',
        'We\'ve extracted your timetable data. Please review and edit any incorrect entries.',
        [{ text: 'Review', onPress: () => setSetupStep('manual') }]
      );
    }, 2000);
  };

  const handleCellPress = (day: string, time: string) => {
    setSelectedCell({ day, time });
    setShowSubjectPicker(true);
  };

  const handleSubjectSelect = (subjectId: string) => {
    if (selectedCell) {
      setTimetableData((prev: any) => ({
        ...prev,
        [selectedCell.day]: {
          ...prev[selectedCell.day],
          [selectedCell.time]: subjectId
        }
      }));
    }
    setShowSubjectPicker(false);
    setSelectedCell(null);
  };

  const saveTimetable = async () => {
    try {
      const timetableConfig = {
        type: timetableType,
        data: timetableData,
        timeSlots,
        createdAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('userTimetable', JSON.stringify(timetableConfig));
      
      Alert.alert(
        '🎉 Timetable Saved!',
        'Your timetable has been successfully set up. You can now view it from the homepage.',
        [
          {
            text: 'Great!',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save timetable. Please try again.');
    }
  };

  const getSubjectInfo = (subjectId: string) => {
    return availableSubjects.find(s => s.id === subjectId) || availableSubjects[0];
  };

  const renderTypeSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose Your Timetable Type</Text>
      <Text style={styles.stepSubtitle}>Select the format that matches your school schedule</Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.typeOption}
          onPress={() => handleTypeSelection('weekly')}
          activeOpacity={0.8}
        >
          <View style={styles.typeIconContainer}>
            <Ionicons name="calendar" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.typeTitle}>Monday - Friday</Text>
          <Text style={styles.typeDescription}>Standard weekly schedule with fixed days</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.typeOption}
          onPress={() => handleTypeSelection('rotating')}
          activeOpacity={0.8}
        >
          <View style={styles.typeIconContainer}>
            <Ionicons name="refresh-circle" size={32} color={theme.colors.accent} />
          </View>
          <Text style={styles.typeTitle}>Day 1 - Day 7</Text>
          <Text style={styles.typeDescription}>Rotating cycle schedule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMethodSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How would you like to set up?</Text>
      <Text style={styles.stepSubtitle}>Choose your preferred setup method</Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.methodOption,
            !USER_IS_PRO && styles.proMethodOption
          ]}
          onPress={() => handleMethodSelection('photo')}
          activeOpacity={0.8}
        >
          <View style={styles.methodIconContainer}>
            <Ionicons name="camera" size={24} color={USER_IS_PRO ? theme.colors.primary : '#9CA3AF'} />
            {!USER_IS_PRO && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          <View style={styles.methodContent}>
            <Text style={[
              styles.methodTitle,
              !USER_IS_PRO && styles.disabledMethodTitle
            ]}>
              📷 Upload/Take Photo {!USER_IS_PRO && '(Pro)'}
            </Text>
            <Text style={[
              styles.methodDescription,
              !USER_IS_PRO && styles.disabledMethodDescription
            ]}>
              {USER_IS_PRO 
                ? 'Scan your printed timetable with OCR' 
                : 'Upgrade to Pro for OCR scanning'
              }
            </Text>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={USER_IS_PRO ? theme.colors.secondary : '#9CA3AF'} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.methodOption}
          onPress={() => handleMethodSelection('manual')}
          activeOpacity={0.8}
        >
          <Ionicons name="create" size={24} color={theme.colors.accent} />
          <View style={styles.methodContent}>
            <Text style={styles.methodTitle}>✍️ Enter Manually</Text>
            <Text style={styles.methodDescription}>Build your timetable step by step</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCameraView = () => (
    <View style={styles.cameraContainer}>
      {Platform.OS === 'web' ? (
        <View style={styles.webCameraPlaceholder}>
          <Ionicons name="camera" size={64} color={theme.colors.primary} />
          <Text style={styles.webCameraText}>Pro OCR Feature</Text>
          <Text style={styles.webCameraSubtext}>Camera scanning available for Pro users</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleCameraCapture}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload" size={20} color={theme.colors.base} />
            <Text style={styles.uploadButtonText}>Simulate OCR Upload</Text>
          </TouchableOpacity>
        </View>
      ) : (
        permission?.granted ? (
          <CameraView style={styles.camera}>
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCameraCapture}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={32} color={theme.colors.base} />
              </TouchableOpacity>
            </View>
          </CameraView>
        ) : (
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-off" size={64} color={theme.colors.secondary} />
            <Text style={styles.permissionText}>Camera permission required</Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        )
      )}
    </View>
  );

  const renderManualSetup = () => (
    <View style={styles.manualContainer}>
      <Text style={styles.stepTitle}>Build Your Timetable</Text>
      <Text style={styles.stepSubtitle}>Tap any cell to assign a subject</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.timetableGrid}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.timeHeaderCell}>
              <Text style={styles.headerText}>Time</Text>
            </View>
            {days.map((day) => (
              <View key={day} style={styles.dayHeaderCell}>
                <Text style={styles.headerText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Time Slots */}
          {timeSlots.map((timeSlot) => (
            <View key={timeSlot} style={styles.timeRow}>
              <View style={styles.timeCell}>
                <Text style={styles.timeText}>{timeSlot}</Text>
              </View>
              {days.map((day) => {
                const subjectId = timetableData[day]?.[timeSlot];
                const subject = subjectId ? getSubjectInfo(subjectId) : null;
                
                return (
                  <TouchableOpacity
                    key={`${day}-${timeSlot}`}
                    style={[
                      styles.subjectCell,
                      subject && { backgroundColor: `${subject.color}20` }
                    ]}
                    onPress={() => handleCellPress(day, timeSlot)}
                    activeOpacity={0.7}
                  >
                    {subject ? (
                      <View style={styles.subjectContent}>
                        <Ionicons 
                          name={subject.icon as any} 
                          size={16} 
                          color={subject.color} 
                        />
                        <Text style={[styles.subjectText, { color: subject.color }]}>
                          {subject.name}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.emptyCell}>
                        <Ionicons name="add" size={20} color={theme.colors.secondary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={saveTimetable}
        activeOpacity={0.8}
      >
        <Ionicons name="checkmark-circle" size={20} color={theme.colors.base} />
        <Text style={styles.saveButtonText}>Save Timetable</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSubjectPicker = () => (
    <Modal
      visible={showSubjectPicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSubjectPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.subjectPickerModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Subject</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSubjectPicker(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={theme.colors.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.subjectsList}>
            {availableSubjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.subjectOption,
                  { backgroundColor: `${subject.color}15` }
                ]}
                onPress={() => handleSubjectSelect(subject.id)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={subject.icon as any} 
                  size={24} 
                  color={subject.color} 
                />
                <Text style={[styles.subjectOptionText, { color: subject.color }]}>
                  {subject.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderUpgradeModal = () => (
    <Modal
      visible={showUpgradeModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowUpgradeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.upgradeModal}>
          <View style={styles.upgradeHeader}>
            <View style={styles.proIconContainer}>
              <Ionicons name="star" size={32} color="#FFD700" />
            </View>
            <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
            <Text style={styles.upgradeSubtitle}>
              Unlock powerful features to enhance your learning experience
            </Text>
          </View>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="camera" size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>OCR Timetable Scanning</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="analytics" size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>Advanced Analytics</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="color-palette" size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>Custom Themes</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="cloud" size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>Cloud Sync</Text>
            </View>
          </View>

          <View style={styles.upgradeButtons}>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Now - R29.99/month</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.alternativeButton}
              onPress={handleAlternativeImageUpload}
              activeOpacity={0.8}
            >
              <Text style={styles.alternativeButtonText}>Continue with Manual Entry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelUpgradeButton}
              onPress={() => setShowUpgradeModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelUpgradeText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setup Timetable</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            { 
              width: setupStep === 'type' ? '25%' : 
                     setupStep === 'method' ? '50%' : 
                     setupStep === 'camera' ? '75%' : '100%' 
            }
          ]} />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {setupStep === 'type' && renderTypeSelection()}
        {setupStep === 'method' && renderMethodSelection()}
        {setupStep === 'camera' && renderCameraView()}
        {setupStep === 'manual' && renderManualSetup()}
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Ionicons name="scan" size={48} color={theme.colors.primary} />
            <Text style={styles.loadingText}>Processing your timetable...</Text>
          </View>
        </View>
      )}

      {/* Subject Picker Modal */}
      {renderSubjectPicker()}

      {/* Upgrade Modal */}
      {renderUpgradeModal()}
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
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  headerPlaceholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 24,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 32,
  },
  optionsContainer: {
    width: '100%',
    gap: 16,
  },
  typeOption: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 8,
  },
  typeDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    textAlign: 'center',
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  proMethodOption: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  methodIconContainer: {
    position: 'relative',
  },
  proBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  proBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#000',
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  disabledMethodTitle: {
    color: '#9CA3AF',
  },
  methodDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  disabledMethodDescription: {
    color: '#9CA3AF',
    opacity: 1,
  },
  cameraContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceLight,
  },
  camera: {
    flex: 1,
    minHeight: 400,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.colors.base,
  },
  webCameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 400,
  },
  webCameraText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  webCameraSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    marginBottom: 24,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  uploadButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 400,
  },
  permissionText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '600',
  },
  manualContainer: {
    padding: 16,
  },
  timetableGrid: {
    backgroundColor: theme.colors.base,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${theme.colors.primary}20`,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
  },
  timeHeaderCell: {
    width: 80,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: theme.colors.base,
  },
  dayHeaderCell: {
    width: 100,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: theme.colors.base,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.base,
    textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.primary}20`,
  },
  timeCell: {
    width: 80,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRightWidth: 1,
    borderRightColor: `${theme.colors.primary}20`,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  subjectCell: {
    width: 100,
    minHeight: 60,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: `${theme.colors.primary}20`,
    backgroundColor: theme.colors.base,
  },
  subjectContent: {
    alignItems: 'center',
    gap: 4,
  },
  subjectText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyCell: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  subjectPickerModal: {
    backgroundColor: theme.colors.base,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
  },
  subjectsList: {
    flex: 1,
  },
  subjectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 16,
  },
  subjectOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    backgroundColor: theme.colors.base,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  upgradeModal: {
    backgroundColor: theme.colors.base,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  upgradeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  proIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 8,
  },
  upgradeSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    textAlign: 'center',
  },
  featuresList: {
    marginBottom: 32,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  upgradeButtons: {
    gap: 12,
  },
  upgradeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '700',
  },
  alternativeButton: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  alternativeButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelUpgradeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelUpgradeText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.7,
  },
});