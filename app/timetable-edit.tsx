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
  Switch,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '@/theme';

const { width: screenWidth } = Dimensions.get('window');

// All available subjects
const allAvailableSubjects = [
  { id: 'math', name: 'Mathematics', color: '#8B5CF6', icon: 'calculator', category: 'Core' },
  { id: 'english', name: 'English', color: '#3B82F6', icon: 'book', category: 'Core' },
  { id: 'science', name: 'Life Science', color: '#10B981', icon: 'leaf', category: 'Science' },
  { id: 'physics', name: 'Physics', color: '#F59E0B', icon: 'planet', category: 'Science' },
  { id: 'chemistry', name: 'Chemistry', color: '#EF4444', icon: 'flask', category: 'Science' },
  { id: 'history', name: 'History', color: '#6366F1', icon: 'library', category: 'Humanities' },
  { id: 'geography', name: 'Geography', color: '#059669', icon: 'earth', category: 'Humanities' },
  { id: 'afrikaans', name: 'Afrikaans', color: '#EC4899', icon: 'language', category: 'Languages' },
  { id: 'business', name: 'Business Studies', color: '#059669', icon: 'briefcase', category: 'Commercial' },
  { id: 'accounting', name: 'Accounting', color: '#DC2626', icon: 'calculator', category: 'Commercial' },
  { id: 'lo', name: 'Life Orientation', color: '#DC2626', icon: 'compass', category: 'Core' },
  { id: 'ems', name: 'EMS', color: '#7C3AED', icon: 'stats-chart', category: 'Commercial' },
  { id: 'tech', name: 'Technology', color: '#0891B2', icon: 'construct', category: 'Technical' },
  { id: 'art', name: 'Visual Arts', color: '#F97316', icon: 'color-palette', category: 'Creative' },
  { id: 'music', name: 'Music', color: '#8B5CF6', icon: 'musical-notes', category: 'Creative' },
  { id: 'drama', name: 'Drama', color: '#EC4899', icon: 'theater', category: 'Creative' },
  { id: 'pe', name: 'Physical Education', color: '#10B981', icon: 'fitness', category: 'Physical' },
  { id: 'computer', name: 'Computer Studies', color: '#6366F1', icon: 'laptop', category: 'Technical' },
  { id: 'french', name: 'French', color: '#3B82F6', icon: 'language', category: 'Languages' },
  { id: 'german', name: 'German', color: '#F59E0B', icon: 'language', category: 'Languages' },
  { id: 'zulu', name: 'isiZulu', color: '#059669', icon: 'language', category: 'Languages' },
  { id: 'xhosa', name: 'isiXhosa', color: '#DC2626', icon: 'language', category: 'Languages' },
  // Non-academic periods
  { id: 'break', name: 'Break', color: '#6B7280', icon: 'cafe', category: 'Breaks' },
  { id: 'lunch', name: 'Lunch', color: '#6B7280', icon: 'restaurant', category: 'Breaks' },
  { id: 'assembly', name: 'Assembly', color: '#9CA3AF', icon: 'people', category: 'Breaks' },
  { id: 'study', name: 'Study Period', color: '#9CA3AF', icon: 'book-open', category: 'Breaks' },
  { id: 'free', name: 'Free Period', color: '#9CA3AF', icon: 'time', category: 'Breaks' },
];

export default function TimetableEditScreen() {
  const [timetableConfig, setTimetableConfig] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{day: string, time: string} | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [showAddTimeSlot, setShowAddTimeSlot] = useState(false);
  const [userSubjects, setUserSubjects] = useState<string[]>([]);
  const [showSubjectManager, setShowSubjectManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubjectForTime, setSelectedSubjectForTime] = useState<string | null>(null);
  const [startTime, setStartTime] = useState({ hour: 8, minute: 0 });
  const [endTime, setEndTime] = useState({ hour: 9, minute: 0 });

  useEffect(() => {
    loadTimetable();
    loadUserSubjects();
  }, []);

  const loadTimetable = async () => {
    try {
      const saved = await AsyncStorage.getItem('userTimetable');
      if (saved) {
        setTimetableConfig(JSON.parse(saved));
      } else {
        // No timetable found, redirect to setup
        router.replace('/timetable-setup');
      }
    } catch (error) {
      console.error('Error loading timetable:', error);
      Alert.alert('Error', 'Failed to load timetable');
    }
  };

  const loadUserSubjects = async () => {
    try {
      const saved = await AsyncStorage.getItem('userSubjects');
      if (saved) {
        setUserSubjects(JSON.parse(saved));
      } else {
        // Default subjects for new users
        const defaultSubjects = ['math', 'english', 'science', 'history', 'break', 'lunch', 'free'];
        setUserSubjects(defaultSubjects);
        await AsyncStorage.setItem('userSubjects', JSON.stringify(defaultSubjects));
      }
    } catch (error) {
      console.error('Error loading user subjects:', error);
    }
  };

  const saveUserSubjects = async (subjects: string[]) => {
    try {
      await AsyncStorage.setItem('userSubjects', JSON.stringify(subjects));
      setUserSubjects(subjects);
    } catch (error) {
      console.error('Error saving user subjects:', error);
    }
  };

  const saveTimetable = async () => {
    try {
      await AsyncStorage.setItem('userTimetable', JSON.stringify(timetableConfig));
      setIsEditMode(false);
      Alert.alert('✅ Saved!', 'Your timetable has been updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save timetable');
    }
  };

  const deleteTimetable = async () => {
    Alert.alert(
      'Delete Timetable',
      'Are you sure you want to delete your timetable? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userTimetable');
              router.replace('/timetable-setup');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete timetable');
            }
          }
        }
      ]
    );
  };

  const handleCellPress = (day: string, time: string) => {
    if (!isEditMode) return;
    setSelectedCell({ day, time });
    setShowSubjectPicker(true);
  };

  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubjectForTime(subjectId);
    setShowSubjectPicker(false);
    setShowTimePicker(true);
  };

  const handleTimeConfirm = () => {
    if (selectedCell && selectedSubjectForTime && timetableConfig) {
      const timeSlot = `${String(startTime.hour).padStart(2, '0')}:${String(startTime.minute).padStart(2, '0')}-${String(endTime.hour).padStart(2, '0')}:${String(endTime.minute).padStart(2, '0')}`;
      
      // Add time slot if it doesn't exist
      const updatedTimeSlots = timetableConfig.timeSlots.includes(timeSlot) 
        ? timetableConfig.timeSlots 
        : [...timetableConfig.timeSlots, timeSlot].sort();
      
      const updatedData = {
        ...timetableConfig.data,
        [selectedCell.day]: {
          ...timetableConfig.data[selectedCell.day],
          [timeSlot]: selectedSubjectForTime
        }
      };
      
      // Remove old entry if it was a different time slot
      if (selectedCell.time !== timeSlot && timetableConfig.data[selectedCell.day]?.[selectedCell.time]) {
        delete updatedData[selectedCell.day][selectedCell.time];
      }
      
      setTimetableConfig({
        ...timetableConfig,
        timeSlots: updatedTimeSlots,
        data: updatedData
      });
    }
    
    setShowTimePicker(false);
    setSelectedCell(null);
    setSelectedSubjectForTime(null);
  };

  const removeSubject = () => {
    if (selectedCell && timetableConfig) {
      const updatedData = { ...timetableConfig.data };
      if (updatedData[selectedCell.day]) {
        delete updatedData[selectedCell.day][selectedCell.time];
      }
      
      setTimetableConfig({
        ...timetableConfig,
        data: updatedData
      });
    }
    setShowSubjectPicker(false);
    setSelectedCell(null);
  };

  const addTimeSlot = () => {
    if (newTimeSlot.trim() && timetableConfig) {
      const updatedTimeSlots = [...timetableConfig.timeSlots, newTimeSlot.trim()];
      setTimetableConfig({
        ...timetableConfig,
        timeSlots: updatedTimeSlots
      });
      setNewTimeSlot('');
      setShowAddTimeSlot(false);
    }
  };

  const removeTimeSlot = (timeSlot: string) => {
    if (timetableConfig) {
      const updatedTimeSlots = timetableConfig.timeSlots.filter((slot: string) => slot !== timeSlot);
      const updatedData = { ...timetableConfig.data };
      
      // Remove this time slot from all days
      Object.keys(updatedData).forEach(day => {
        if (updatedData[day][timeSlot]) {
          delete updatedData[day][timeSlot];
        }
      });
      
      setTimetableConfig({
        ...timetableConfig,
        timeSlots: updatedTimeSlots,
        data: updatedData
      });
    }
  };

  const switchTimetableType = () => {
    if (timetableConfig) {
      const newType = timetableConfig.type === 'weekly' ? 'rotating' : 'weekly';
      Alert.alert(
        'Switch Timetable Type',
        `Switch to ${newType === 'weekly' ? 'Monday-Friday' : 'Day 1-7'} format? This will clear your current timetable data.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch',
            onPress: () => {
              setTimetableConfig({
                ...timetableConfig,
                type: newType,
                data: {}
              });
            }
          }
        ]
      );
    }
  };

  const toggleSubjectInUserList = (subjectId: string) => {
    const updatedSubjects = userSubjects.includes(subjectId)
      ? userSubjects.filter(id => id !== subjectId)
      : [...userSubjects, subjectId];
    
    saveUserSubjects(updatedSubjects);
  };

  const getSubjectInfo = (subjectId: string) => {
    return allAvailableSubjects.find(s => s.id === subjectId) || allAvailableSubjects[0];
  };

  const getCurrentDay = () => {
    const today = new Date().getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[today];
  };

  const getNextClass = () => {
    if (!timetableConfig || timetableConfig.type !== 'weekly') return null;
    
    const currentDay = getCurrentDay();
    const currentTime = new Date().getHours() * 60 + new Date().getMinutes();
    
    if (!timetableConfig.data[currentDay]) return null;
    
    const todaySchedule = timetableConfig.data[currentDay];
    
    for (const timeSlot of timetableConfig.timeSlots) {
      const [startTime] = timeSlot.split('-');
      const [hours, minutes] = startTime.split(':').map(Number);
      const slotTime = hours * 60 + minutes;
      
      if (slotTime > currentTime && todaySchedule[timeSlot]) {
        const subject = getSubjectInfo(todaySchedule[timeSlot]);
        return {
          subject: subject.name,
          time: timeSlot,
          color: subject.color
        };
      }
    }
    
    return null;
  };

  // Filter subjects for picker
  const getFilteredSubjects = () => {
    const userSubjectsList = allAvailableSubjects.filter(subject => 
      userSubjects.includes(subject.id)
    );

    return userSubjectsList.filter(subject => {
      const matchesSearch = !searchQuery || 
        subject.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || 
        subject.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  };

  // Get categories from user's subjects
  const getUserSubjectCategories = () => {
    const userSubjectsList = allAvailableSubjects.filter(subject => 
      userSubjects.includes(subject.id)
    );
    const categories = [...new Set(userSubjectsList.map(s => s.category))];
    return ['All', ...categories.sort()];
  };

  // Filter subjects for subject manager
  const getFilteredAllSubjects = () => {
    return allAvailableSubjects.filter(subject => {
      const matchesSearch = !searchQuery || 
        subject.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || 
        subject.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  };

  // Get all categories
  const getAllCategories = () => {
    const categories = [...new Set(allAvailableSubjects.map(s => s.category))];
    return ['All', ...categories.sort()];
  };

  // Time picker wheel component
  const renderTimeWheel = (value: number, max: number, onChange: (value: number) => void, step: number = 1) => {
    const values = [];
    for (let i = 0; i <= max; i += step) {
      values.push(i);
    }

    return (
      <View style={styles.timeWheel}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.wheelScroll}>
          {values.map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.wheelItem,
                value === val && styles.selectedWheelItem
              ]}
              onPress={() => onChange(val)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.wheelText,
                value === val && styles.selectedWheelText
              ]}>
                {String(val).padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (!timetableConfig) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="calendar" size={64} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your timetable...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const days = timetableConfig.type === 'weekly' 
    ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

  const nextClass = getNextClass();

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
        <Text style={styles.headerTitle}>My Timetable</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="settings" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Next Class Banner */}
      {nextClass && (
        <View style={[styles.nextClassBanner, { backgroundColor: `${nextClass.color}15` }]}>
          <Ionicons name="time" size={20} color={nextClass.color} />
          <Text style={[styles.nextClassText, { color: nextClass.color }]}>
            Next: {nextClass.subject} at {nextClass.time}
          </Text>
        </View>
      )}

      {/* Edit Mode Toggle */}
      <View style={styles.editModeContainer}>
        <Text style={styles.editModeLabel}>Edit Mode</Text>
        <Switch
          value={isEditMode}
          onValueChange={setIsEditMode}
          trackColor={{ false: theme.colors.surfaceLight, true: `${theme.colors.primary}40` }}
          thumbColor={isEditMode ? theme.colors.primary : theme.colors.secondary}
        />
      </View>

      {/* Subject Management Button */}
      {isEditMode && (
        <View style={styles.editActionsContainer}>
          <TouchableOpacity
            style={styles.manageSubjectsButton}
            onPress={() => setShowSubjectManager(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="library" size={20} color={theme.colors.primary} />
            <Text style={styles.manageSubjectsText}>Manage My Subjects ({userSubjects.length})</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Timetable Grid */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            {timetableConfig.timeSlots.map((timeSlot: string) => (
              <View key={timeSlot} style={styles.timeRow}>
                <View style={styles.timeCell}>
                  <Text style={styles.timeText}>{timeSlot}</Text>
                  {isEditMode && (
                    <TouchableOpacity
                      style={styles.removeTimeButton}
                      onPress={() => removeTimeSlot(timeSlot)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
                {days.map((day) => {
                  const subjectId = timetableConfig.data[day]?.[timeSlot];
                  const subject = subjectId ? getSubjectInfo(subjectId) : null;
                  
                  return (
                    <TouchableOpacity
                      key={`${day}-${timeSlot}`}
                      style={[
                        styles.subjectCell,
                        subject && { backgroundColor: `${subject.color}20` },
                        isEditMode && styles.editableCell
                      ]}
                      onPress={() => handleCellPress(day, timeSlot)}
                      activeOpacity={isEditMode ? 0.7 : 1}
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
                        isEditMode && (
                          <View style={styles.emptyCell}>
                            <Ionicons name="add" size={20} color={theme.colors.secondary} />
                          </View>
                        )
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Add Time Slot Button */}
        {isEditMode && (
          <TouchableOpacity
            style={styles.addTimeSlotButton}
            onPress={() => setShowAddTimeSlot(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={20} color={theme.colors.primary} />
            <Text style={styles.addTimeSlotText}>Add Time Slot</Text>
          </TouchableOpacity>
        )}

        {/* Save Button */}
        {isEditMode && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveTimetable}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.base} />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Subject Picker Modal */}
      <Modal
        visible={showSubjectPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubjectPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.subjectPickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📚 Select Subject</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSubjectPicker(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Choose a subject for this time slot</Text>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={theme.colors.secondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search subjects..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={`${theme.colors.secondary}60`}
              />
            </View>

            {/* Category Filter */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryFilter}
            >
              {getUserSubjectCategories().map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.activeCategoryChip
                  ]}
                  onPress={() => setSelectedCategory(category)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.activeCategoryChipText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.subjectsList}>
              {getFilteredSubjects().map((subject) => (
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
                  <View style={styles.subjectOptionContent}>
                    <Text style={[styles.subjectOptionText, { color: subject.color }]}>
                      {subject.name}
                    </Text>
                    <Text style={styles.subjectCategoryText}>{subject.category}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={subject.color} />
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={styles.removeSubjectOption}
                onPress={removeSubject}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={24} color="#EF4444" />
                <Text style={styles.removeSubjectText}>Remove Subject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.manageSubjectsOption}
                onPress={() => {
                  setShowSubjectPicker(false);
                  setShowSubjectManager(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="library" size={24} color={theme.colors.primary} />
                <Text style={styles.manageSubjectsOptionText}>Manage My Subjects</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⏰ Set Time</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTimePicker(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>

            {selectedSubjectForTime && (
              <View style={styles.selectedSubjectDisplay}>
                <Text style={styles.selectedSubjectText}>
                  Setting time for: {getSubjectInfo(selectedSubjectForTime).name}
                </Text>
              </View>
            )}

            <View style={styles.timePickerContainer}>
              {/* Start Time */}
              <View style={styles.timeSection}>
                <Text style={styles.timeSectionTitle}>🕒 Start Time</Text>
                <View style={styles.timeWheels}>
                  <View style={styles.wheelContainer}>
                    <Text style={styles.wheelLabel}>Hour</Text>
                    {renderTimeWheel(startTime.hour, 23, (hour) => setStartTime(prev => ({ ...prev, hour })))}
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.wheelContainer}>
                    <Text style={styles.wheelLabel}>Min</Text>
                    {renderTimeWheel(startTime.minute, 59, (minute) => setStartTime(prev => ({ ...prev, minute })), 15)}
                  </View>
                </View>
              </View>

              {/* End Time */}
              <View style={styles.timeSection}>
                <Text style={styles.timeSectionTitle}>🕕 End Time</Text>
                <View style={styles.timeWheels}>
                  <View style={styles.wheelContainer}>
                    <Text style={styles.wheelLabel}>Hour</Text>
                    {renderTimeWheel(endTime.hour, 23, (hour) => setEndTime(prev => ({ ...prev, hour })))}
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.wheelContainer}>
                    <Text style={styles.wheelLabel}>Min</Text>
                    {renderTimeWheel(endTime.minute, 59, (minute) => setEndTime(prev => ({ ...prev, minute })), 15)}
                  </View>
                </View>
              </View>
            </View>

            {/* Time Preview */}
            <View style={styles.timePreview}>
              <Text style={styles.timePreviewText}>
                {String(startTime.hour).padStart(2, '0')}:{String(startTime.minute).padStart(2, '0')} - {String(endTime.hour).padStart(2, '0')}:{String(endTime.minute).padStart(2, '0')}
              </Text>
            </View>

            <View style={styles.timePickerButtons}>
              <TouchableOpacity
                style={styles.cancelTimeButton}
                onPress={() => setShowTimePicker(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelTimeButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmTimeButton}
                onPress={handleTimeConfirm}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.base} />
                <Text style={styles.confirmTimeButtonText}>Save Slot</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subject Manager Modal */}
      <Modal
        visible={showSubjectManager}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubjectManager(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.subjectManagerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage My Subjects</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSubjectManager(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.subjectManagerDescription}>
              Select the subjects you want to use in your timetable. You currently have {userSubjects.length} subjects selected.
            </Text>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={theme.colors.secondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search all subjects..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={`${theme.colors.secondary}60`}
              />
            </View>

            {/* Category Filter */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryFilter}
            >
              {getAllCategories().map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.activeCategoryChip
                  ]}
                  onPress={() => setSelectedCategory(category)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.activeCategoryChipText
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView style={styles.subjectsList}>
              {getFilteredAllSubjects().map((subject) => {
                const isSelected = userSubjects.includes(subject.id);
                return (
                  <TouchableOpacity
                    key={subject.id}
                    style={[
                      styles.subjectManagerOption,
                      { backgroundColor: `${subject.color}15` },
                      isSelected && styles.selectedSubjectManagerOption
                    ]}
                    onPress={() => toggleSubjectInUserList(subject.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={subject.icon as any} 
                      size={24} 
                      color={subject.color} 
                    />
                    <View style={styles.subjectOptionContent}>
                      <Text style={[styles.subjectOptionText, { color: subject.color }]}>
                        {subject.name}
                      </Text>
                      <Text style={styles.subjectCategoryText}>{subject.category}</Text>
                    </View>
                    <View style={[
                      styles.selectionIndicator,
                      isSelected && styles.selectedIndicator
                    ]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color={theme.colors.base} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowSubjectManager(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Done ({userSubjects.length} subjects)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Timetable Settings</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSettings(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsContent}>
              <TouchableOpacity
                style={styles.settingOption}
                onPress={() => {
                  setShowSettings(false);
                  setShowSubjectManager(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="library" size={24} color={theme.colors.primary} />
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Manage Subjects</Text>
                  <Text style={styles.settingDescription}>
                    Add or remove subjects ({userSubjects.length} selected)
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.secondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingOption}
                onPress={switchTimetableType}
                activeOpacity={0.7}
              >
                <Ionicons name="swap-horizontal" size={24} color={theme.colors.primary} />
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Switch Format</Text>
                  <Text style={styles.settingDescription}>
                    Currently: {timetableConfig.type === 'weekly' ? 'Monday-Friday' : 'Day 1-7'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.secondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingOption}
                onPress={() => router.push('/timetable-setup')}
                activeOpacity={0.7}
              >
                <Ionicons name="camera" size={24} color={theme.colors.accent} />
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Re-upload Photo</Text>
                  <Text style={styles.settingDescription}>Scan a new timetable image</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.secondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingOption, styles.dangerOption]}
                onPress={deleteTimetable}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={24} color="#EF4444" />
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: '#EF4444' }]}>Delete Timetable</Text>
                  <Text style={styles.settingDescription}>Start over with a new timetable</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Time Slot Modal */}
      <Modal
        visible={showAddTimeSlot}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddTimeSlot(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addTimeSlotModal}>
            <Text style={styles.modalTitle}>Add Time Slot</Text>
            <TextInput
              style={styles.timeSlotInput}
              placeholder="e.g., 14:00-15:00"
              value={newTimeSlot}
              onChangeText={setNewTimeSlot}
              autoCapitalize="none"
            />
            <View style={styles.addTimeSlotButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddTimeSlot(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addTimeSlot}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
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
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
  },
  nextClassBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextClassText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surfaceLight,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  editModeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  editActionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  manageSubjectsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
  },
  manageSubjectsText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  content: {
    flex: 1,
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
    width: 100,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: theme.colors.base,
  },
  dayHeaderCell: {
    width: 120,
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
    width: 100,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRightWidth: 1,
    borderRightColor: `${theme.colors.primary}20`,
    position: 'relative',
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.secondary,
    textAlign: 'center',
  },
  removeTimeButton: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  subjectCell: {
    width: 120,
    minHeight: 60,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: `${theme.colors.primary}20`,
    backgroundColor: theme.colors.base,
  },
  editableCell: {
    borderWidth: 1,
    borderColor: `${theme.colors.primary}40`,
    borderStyle: 'dashed',
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
  addTimeSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  addTimeSlotText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 16,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
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
    maxHeight: '80%',
  },
  timePickerModal: {
    backgroundColor: theme.colors.base,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  subjectManagerModal: {
    backgroundColor: theme.colors.base,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  settingsModal: {
    backgroundColor: theme.colors.base,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '60%',
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
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    marginBottom: 16,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
  },
  selectedSubjectDisplay: {
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  selectedSubjectText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  timePickerContainer: {
    gap: 24,
    marginBottom: 24,
  },
  timeSection: {
    alignItems: 'center',
  },
  timeSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 16,
  },
  timeWheels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  wheelContainer: {
    alignItems: 'center',
  },
  wheelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 8,
  },
  timeWheel: {
    width: 80,
    height: 120,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    overflow: 'hidden',
  },
  wheelScroll: {
    flex: 1,
  },
  wheelItem: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.primary}20`,
  },
  selectedWheelItem: {
    backgroundColor: theme.colors.primary,
  },
  wheelText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  selectedWheelText: {
    color: theme.colors.base,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  timePreview: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  timePreviewText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  timePickerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelTimeButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelTimeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  confirmTimeButton: {
    flex: 2,
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
  confirmTimeButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '700',
  },
  subjectManagerDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    marginBottom: 16,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
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
  categoryFilter: {
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeCategoryChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.secondary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  activeCategoryChipText: {
    color: theme.colors.base,
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
  subjectOptionContent: {
    flex: 1,
  },
  subjectOptionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subjectCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.6,
  },
  subjectManagerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSubjectManagerOption: {
    borderColor: theme.colors.primary,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.secondary,
  },
  selectedIndicator: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  removeSubjectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    gap: 16,
  },
  removeSubjectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  manageSubjectsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    backgroundColor: `${theme.colors.primary}15`,
    gap: 16,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
  },
  manageSubjectsOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  doneButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '700',
  },
  settingsContent: {
    gap: 8,
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  dangerOption: {
    backgroundColor: '#FEF2F2',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  addTimeSlotModal: {
    backgroundColor: theme.colors.base,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
  },
  timeSlotInput: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    width: '100%',
    marginVertical: 16,
  },
  addTimeSlotButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  addButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.base,
  },
});