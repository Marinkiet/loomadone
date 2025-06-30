import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';
import * as ImagePicker from 'expo-image-picker';

// South African CAPS curriculum subjects by grade group
const subjectsByGrade = {
  'Grade 8': {
    compulsory: [
      { name: 'English Home Language', category: 'Languages', icon: 'book-outline', color: '#3B82F6' },
      { name: 'Afrikaans First Additional Language', category: 'Languages', icon: 'language-outline', color: '#F59E0B' },
      { name: 'Mathematics', category: 'Mathematics', icon: 'calculator-outline', color: '#8B5CF6' },
      { name: 'Natural Sciences', category: 'Sciences', icon: 'flask-outline', color: '#10B981' },
      { name: 'Social Sciences', category: 'Social Sciences', icon: 'globe-outline', color: '#6366F1' },
      { name: 'Economic and Management Sciences', category: 'Business', icon: 'briefcase-outline', color: '#059669' },
      { name: 'Technology', category: 'Technology', icon: 'construct-outline', color: '#0891B2' },
      { name: 'Life Orientation', category: 'Life Skills', icon: 'compass-outline', color: '#DC2626' },
    ],
    optional: [
      { name: 'Creative Arts', category: 'Arts', icon: 'color-palette-outline', color: '#EC4899' },
      { name: 'IsiZulu First Additional Language', category: 'Languages', icon: 'language-outline', color: '#F59E0B' },
      { name: 'IsiXhosa First Additional Language', category: 'Languages', icon: 'language-outline', color: '#F59E0B' },
    ]
  },
  'Grade 9': {
    compulsory: [
      { name: 'English Home Language', category: 'Languages', icon: 'book-outline', color: '#3B82F6' },
      { name: 'Afrikaans First Additional Language', category: 'Languages', icon: 'language-outline', color: '#F59E0B' },
      { name: 'Mathematics', category: 'Mathematics', icon: 'calculator-outline', color: '#8B5CF6' },
      { name: 'Natural Sciences', category: 'Sciences', icon: 'flask-outline', color: '#10B981' },
      { name: 'Social Sciences', category: 'Social Sciences', icon: 'globe-outline', color: '#6366F1' },
      { name: 'Economic and Management Sciences', category: 'Business', icon: 'briefcase-outline', color: '#059669' },
      { name: 'Technology', category: 'Technology', icon: 'construct-outline', color: '#0891B2' },
      { name: 'Life Orientation', category: 'Life Skills', icon: 'compass-outline', color: '#DC2626' },
    ],
    optional: [
      { name: 'Creative Arts', category: 'Arts', icon: 'color-palette-outline', color: '#EC4899' },
      { name: 'IsiZulu First Additional Language', category: 'Languages', icon: 'language-outline', color: '#F59E0B' },
      { name: 'IsiXhosa First Additional Language', category: 'Languages', icon: 'language-outline', color: '#F59E0B' },
    ]
  },
  'Grade 10': {
    compulsory: [
      { name: 'English Home Language', category: 'Languages', icon: 'book-outline', color: '#3B82F6' },
      { name: 'Afrikaans First Additional Language', category: 'Languages', icon: 'language-outline', color: '#F59E0B' },
      { name: 'Life Orientation', category: 'Life Skills', icon: 'compass-outline', color: '#DC2626' },
    ],
    mathChoice: [
      { name: 'Mathematics', category: 'Mathematics', icon: 'calculator-outline', color: '#8B5CF6' },
      { name: 'Mathematical Literacy', category: 'Mathematics', icon: 'stats-chart-outline', color: '#7C3AED' },
    ],
    electives: [
      { name: 'Physical Sciences', category: 'Sciences', icon: 'planet-outline', color: '#F59E0B' },
      { name: 'Life Sciences', category: 'Sciences', icon: 'leaf-outline', color: '#10B981' },
      { name: 'Geography', category: 'Social Sciences', icon: 'earth-outline', color: '#059669' },
      { name: 'History', category: 'Social Sciences', icon: 'library-outline', color: '#6366F1' },
      { name: 'Business Studies', category: 'Business', icon: 'briefcase-outline', color: '#059669' },
      { name: 'Economics', category: 'Business', icon: 'trending-up-outline', color: '#0891B2' },
      { name: 'Accounting', category: 'Business', icon: 'calculator-outline', color: '#EF4444' },
      { name: 'Computer Applications Technology', category: 'Technology', icon: 'desktop-outline', color: '#0891B2' },
      { name: 'Information Technology', category: 'Technology', icon: 'hardware-chip-outline', color: '#7C3AED' },
      { name: 'Visual Arts', category: 'Arts', icon: 'brush-outline', color: '#EC4899' },
      { name: 'Dramatic Arts', category: 'Arts', icon: 'musical-notes-outline', color: '#F59E0B' },
      { name: 'Tourism', category: 'Business', icon: 'airplane-outline', color: '#10B981' },
      { name: 'Engineering Graphics and Design', category: 'Technology', icon: 'construct-outline', color: '#6366F1' },
      { name: 'Agricultural Sciences', category: 'Sciences', icon: 'leaf-outline', color: '#059669' },
      { name: 'Consumer Studies', category: 'Life Skills', icon: 'home-outline', color: '#EC4899' },
    ]
  },
  'Grade 11': {
    compulsory: [
      { name: 'English Home Language', category: 'Languages', icon: 'book-outline', color: '#3B82F6' },
      { name: 'Afrikaans First Additional Language', category: 'Languages', icon: 'language-outline', color: '#F59E0B' },
      { name: 'Life Orientation', category: 'Life Skills', icon: 'compass-outline', color: '#DC2626' },
    ],
    mathChoice: [
      { name: 'Mathematics', category: 'Mathematics', icon: 'calculator-outline', color: '#8B5CF6' },
      { name: 'Mathematical Literacy', category: 'Mathematics', icon: 'stats-chart-outline', color: '#7C3AED' },
    ],
    electives: [
      { name: 'Physical Sciences', category: 'Sciences', icon: 'planet-outline', color: '#F59E0B' },
      { name: 'Life Sciences', category: 'Sciences', icon: 'leaf-outline', color: '#10B981' },
      { name: 'Geography', category: 'Social Sciences', icon: 'earth-outline', color: '#059669' },
      { name: 'History', category: 'Social Sciences', icon: 'library-outline', color: '#6366F1' },
      { name: 'Business Studies', category: 'Business', icon: 'briefcase-outline', color: '#059669' },
      { name: 'Economics', category: 'Business', icon: 'trending-up-outline', color: '#0891B2' },
      { name: 'Accounting', category: 'Business', icon: 'calculator-outline', color: '#EF4444' },
      { name: 'Computer Applications Technology', category: 'Technology', icon: 'desktop-outline', color: '#0891B2' },
      { name: 'Information Technology', category: 'Technology', icon: 'hardware-chip-outline', color: '#7C3AED' },
      { name: 'Visual Arts', category: 'Arts', icon: 'brush-outline', color: '#EC4899' },
      { name: 'Dramatic Arts', category: 'Arts', icon: 'musical-notes-outline', color: '#F59E0B' },
      { name: 'Tourism', category: 'Business', icon: 'airplane-outline', color: '#10B981' },
      { name: 'Engineering Graphics and Design', category: 'Technology', icon: 'construct-outline', color: '#6366F1' },
      { name: 'Agricultural Sciences', category: 'Sciences', icon: 'leaf-outline', color: '#059669' },
      { name: 'Consumer Studies', category: 'Life Skills', icon: 'home-outline', color: '#EC4899' },
    ]
  },
  'Grade 12': {
    compulsory: [
      { name: 'English Home Language', category: 'Languages', icon: 'book-outline', color: '#3B82F6' },
      { name: 'Afrikaans First Additional Language', category: 'Languages', icon: 'language-outline', color: '#F59E0B' },
      { name: 'Life Orientation', category: 'Life Skills', icon: 'compass-outline', color: '#DC2626' },
    ],
    mathChoice: [
      { name: 'Mathematics', category: 'Mathematics', icon: 'calculator-outline', color: '#8B5CF6' },
      { name: 'Mathematical Literacy', category: 'Mathematics', icon: 'stats-chart-outline', color: '#7C3AED' },
    ],
    electives: [
      { name: 'Physical Sciences', category: 'Sciences', icon: 'planet-outline', color: '#F59E0B' },
      { name: 'Life Sciences', category: 'Sciences', icon: 'leaf-outline', color: '#10B981' },
      { name: 'Geography', category: 'Social Sciences', icon: 'earth-outline', color: '#059669' },
      { name: 'History', category: 'Social Sciences', icon: 'library-outline', color: '#6366F1' },
      { name: 'Business Studies', category: 'Business', icon: 'briefcase-outline', color: '#059669' },
      { name: 'Economics', category: 'Business', icon: 'trending-up-outline', color: '#0891B2' },
      { name: 'Accounting', category: 'Business', icon: 'calculator-outline', color: '#EF4444' },
      { name: 'Computer Applications Technology', category: 'Technology', icon: 'desktop-outline', color: '#0891B2' },
      { name: 'Information Technology', category: 'Technology', icon: 'hardware-chip-outline', color: '#7C3AED' },
      { name: 'Visual Arts', category: 'Arts', icon: 'brush-outline', color: '#EC4899' },
      { name: 'Dramatic Arts', category: 'Arts', icon: 'musical-notes-outline', color: '#F59E0B' },
      { name: 'Tourism', category: 'Business', icon: 'airplane-outline', color: '#10B981' },
      { name: 'Engineering Graphics and Design', category: 'Technology', icon: 'construct-outline', color: '#6366F1' },
      { name: 'Agricultural Sciences', category: 'Sciences', icon: 'leaf-outline', color: '#059669' },
      { name: 'Consumer Studies', category: 'Life Skills', icon: 'home-outline', color: '#EC4899' },
    ]
  }
};

const grades = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showGradeList, setShowGradeList] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    grade: '',
    subjects: [] as string[],
    profile_image: '',
  });
  const [validationErrors, setValidationErrors] = useState({
    full_name: '',
    grade: '',
    subjects: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        grade: user.grade || '',
        subjects: user.subjects || [],
        profile_image: user.profile_image || '',
      });
    }
  }, [user]);

  const getMinimumSubjects = () => {
    if (['Grade 8', 'Grade 9'].includes(formData.grade)) {
      return 6; // Most subjects are compulsory
    }
    return 4; // Compulsory + math choice + 3 electives minimum
  };

  const getMaximumSubjects = () => {
    if (['Grade 8', 'Grade 9'].includes(formData.grade)) {
      return 10; // All available subjects
    }
    return 7; // Compulsory + math choice + 4 electives maximum
  };

  const getCurrentSubjects = () => {
    if (!formData.grade) return { compulsory: [], mathChoice: [], electives: [], optional: [] };
    return subjectsByGrade[formData.grade as keyof typeof subjectsByGrade] || { compulsory: [], mathChoice: [], electives: [], optional: [] };
  };

  const validateForm = () => {
    const errors = {
      full_name: '',
      grade: '',
      subjects: '',
    };

    // Validate name
    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }

    // Validate grade
    if (!formData.grade) {
      errors.grade = 'Please select your grade';
    }

    // Validate subjects
    const minSubjects = getMinimumSubjects();
    if (formData.subjects.length < minSubjects) {
      errors.subjects = `Please select at least ${minSubjects} subjects`;
    }

    setValidationErrors(errors);
    return !errors.full_name && !errors.grade && !errors.subjects;
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors when user starts typing
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGradeSelect = (grade: string) => {
    setFormData(prev => ({ 
      ...prev, 
      grade,
      subjects: [], // Reset subjects when grade changes
    }));
    setShowGradeList(false);
  };

  const handleSubjectToggle = (subjectName: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectName)
        ? prev.subjects.filter(name => name !== subjectName)
        : prev.subjects.length < getMaximumSubjects()
          ? [...prev.subjects, subjectName]
          : prev.subjects
    }));
  };

  const handleImagePicker = async () => {
    if (Platform.OS === 'web') {
      // For web, show URL input dialog
      Alert.prompt(
        'Profile Image',
        'Enter image URL:',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Save', 
            onPress: (url) => {
              if (url) {
                setFormData(prev => ({ ...prev, profile_image: url }));
              }
            }
          }
        ],
        'plain-text',
        formData.profile_image
      );
      return;
    }

    // For mobile, use image picker
    Alert.alert(
      'Update Profile Picture',
      'Choose an option:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Enter URL', onPress: enterImageURL },
      ]
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, profile_image: result.assets[0].uri }));
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library permissions to choose images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData(prev => ({ ...prev, profile_image: result.assets[0].uri }));
    }
  };

  const enterImageURL = () => {
    Alert.prompt(
      'Profile Image URL',
      'Enter the URL of your profile image:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: (url) => {
            if (url) {
              setFormData(prev => ({ ...prev, profile_image: url }));
            }
          }
        }
      ],
      'plain-text',
      formData.profile_image
    );
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    
    try {
      await updateProfile({
        full_name: formData.full_name.trim(),
        grade: formData.grade,
        subjects: formData.subjects,
        profile_image: formData.profile_image || null,
      });

      Alert.alert(
        '✅ Profile Updated!',
        'Your profile has been successfully updated.',
        [
          {
            text: 'Great!',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Update Failed',
        error.message || 'Failed to update profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes?',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  const renderSubjectsByCategory = (subjects: any[], title: string, isRequired = false) => {
    if (subjects.length === 0) return null;

    // Group subjects by category
    const groupedSubjects = subjects.reduce((acc, subject) => {
      if (!acc[subject.category]) {
        acc[subject.category] = [];
      }
      acc[subject.category].push(subject);
      return acc;
    }, {} as Record<string, any[]>);

    return (
      <View style={styles.subjectSection}>
        <View style={styles.subjectSectionHeader}>
          <Text style={styles.subjectSectionTitle}>{title}</Text>
          {isRequired && <Text style={styles.requiredLabel}>Required</Text>}
        </View>
        
        {Object.entries(groupedSubjects).map(([category, categorySubjects]) => (
          <View key={category} style={styles.categoryGroup}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.subjectsGrid}>
              {categorySubjects.map((subject) => (
                <TouchableOpacity
                  key={subject.name}
                  style={[
                    styles.subjectCheckbox,
                    { borderColor: subject.color },
                    formData.subjects.includes(subject.name) && [
                      styles.selectedSubjectCheckbox,
                      { backgroundColor: subject.color }
                    ]
                  ]}
                  onPress={() => handleSubjectToggle(subject.name)}
                  activeOpacity={0.8}
                >
                  <View style={styles.checkboxContainer}>
                    <View style={[
                      styles.checkbox,
                      { borderColor: subject.color },
                      formData.subjects.includes(subject.name) && [
                        styles.checkedCheckbox,
                        { backgroundColor: subject.color }
                      ]
                    ]}>
                      {formData.subjects.includes(subject.name) && (
                        <Ionicons name="checkmark" size={16} color={theme.colors.base} />
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.subjectInfo}>
                    <View style={styles.subjectHeader}>
                      <Ionicons 
                        name={subject.icon as any} 
                        size={18} 
                        color={subject.color} 
                      />
                      <Text style={[
                        styles.subjectName,
                        { color: subject.color },
                        formData.subjects.includes(subject.name) && styles.selectedSubjectName
                      ]}>
                        {subject.name}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const currentSubjects = getCurrentSubjects();
  const isGrade8or9 = ['Grade 8', 'Grade 9'].includes(formData.grade);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={theme.colors.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.7}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.colors.base} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={handleImagePicker}
              activeOpacity={0.8}
            >
              {formData.profile_image ? (
                <Image 
                  source={{ uri: formData.profile_image }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.defaultImageContainer}>
                  <Ionicons name="person" size={48} color={theme.colors.primary} />
                </View>
              )}
              <View style={styles.imageEditOverlay}>
                <Ionicons name="camera" size={20} color={theme.colors.base} />
              </View>
            </TouchableOpacity>
            <Text style={styles.imageHint}>Tap to change profile picture</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={[
                styles.inputWrapper,
                validationErrors.full_name && styles.inputWrapperError
              ]}>
                <Ionicons name="person-outline" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your full name"
                  placeholderTextColor={`${theme.colors.secondary}60`}
                  value={formData.full_name}
                  onChangeText={(value) => handleInputChange('full_name', value)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              {validationErrors.full_name && (
                <Text style={styles.fieldErrorText}>{validationErrors.full_name}</Text>
              )}
            </View>

            {/* Grade Selector */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Grade</Text>
              <TouchableOpacity
                style={[
                  styles.gradeSelector, 
                  showGradeList && styles.gradeSelectorActive,
                  validationErrors.grade && styles.inputWrapperError
                ]}
                onPress={() => setShowGradeList(!showGradeList)}
                activeOpacity={0.8}
              >
                <Ionicons name="school-outline" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <Text style={[
                  styles.gradeSelectorText,
                  !formData.grade && styles.placeholderText
                ]}>
                  {formData.grade || 'Select your grade'}
                </Text>
                <Ionicons 
                  name={showGradeList ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.colors.secondary} 
                />
              </TouchableOpacity>

              {/* Grade List */}
              {showGradeList && (
                <View style={styles.gradeList}>
                  {grades.map((grade) => (
                    <TouchableOpacity
                      key={grade}
                      style={[
                        styles.gradeItem,
                        formData.grade === grade && styles.selectedGradeItem
                      ]}
                      onPress={() => handleGradeSelect(grade)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.gradeItemText,
                        formData.grade === grade && styles.selectedGradeItemText
                      ]}>
                        {grade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {validationErrors.grade && (
                <Text style={styles.fieldErrorText}>{validationErrors.grade}</Text>
              )}
            </View>

            {/* Subjects Selection */}
            {formData.grade && (
              <View style={styles.inputContainer}>
                <View style={styles.subjectsHeader}>
                  <Text style={styles.inputLabel}>
                    Select Your Subjects ({formData.subjects.length}/{getMaximumSubjects()})
                  </Text>
                  <Text style={styles.inputHint}>
                    {isGrade8or9 
                      ? 'Most subjects are compulsory in Grade 8-9'
                      : `Choose ${getMinimumSubjects()}-${getMaximumSubjects()} subjects including compulsory ones`
                    }
                  </Text>
                </View>

                <ScrollView style={styles.subjectsScrollView} showsVerticalScrollIndicator={false}>
                  {/* Compulsory Subjects */}
                  {renderSubjectsByCategory(currentSubjects.compulsory, 'Compulsory Subjects', true)}
                  
                  {/* Math Choice for Grades 10-12 */}
                  {!isGrade8or9 && currentSubjects.mathChoice && (
                    <View style={styles.subjectSection}>
                      <View style={styles.subjectSectionHeader}>
                        <Text style={styles.subjectSectionTitle}>Mathematics (Choose One)</Text>
                        <Text style={styles.requiredLabel}>Required</Text>
                      </View>
                      
                      <View style={styles.mathChoiceContainer}>
                        {currentSubjects.mathChoice.map((mathSubject) => (
                          <TouchableOpacity
                            key={mathSubject.name}
                            style={[
                              styles.mathChoiceOption,
                              { borderColor: mathSubject.color },
                              formData.subjects.includes(mathSubject.name) && [
                                styles.selectedMathChoice,
                                { backgroundColor: mathSubject.color }
                              ]
                            ]}
                            onPress={() => {
                              // Remove other math subjects and add selected one
                              const otherMathSubjects = currentSubjects.mathChoice?.filter(m => m.name !== mathSubject.name).map(m => m.name) || [];
                              const newSubjects = formData.subjects.filter(s => !otherMathSubjects.includes(s) && s !== mathSubject.name);
                              if (!formData.subjects.includes(mathSubject.name)) {
                                newSubjects.push(mathSubject.name);
                              }
                              handleInputChange('subjects', newSubjects);
                            }}
                            activeOpacity={0.8}
                          >
                            <View style={[
                              styles.radioButton,
                              { borderColor: mathSubject.color },
                              formData.subjects.includes(mathSubject.name) && [
                                styles.selectedRadioButton,
                                { backgroundColor: mathSubject.color }
                              ]
                            ]}>
                              {formData.subjects.includes(mathSubject.name) && (
                                <View style={styles.radioButtonInner} />
                              )}
                            </View>
                            
                            <Ionicons 
                              name={mathSubject.icon as any} 
                              size={24} 
                              color={formData.subjects.includes(mathSubject.name) ? theme.colors.base : mathSubject.color} 
                            />
                            <Text style={[
                              styles.mathChoiceText,
                              { color: mathSubject.color },
                              formData.subjects.includes(mathSubject.name) && styles.selectedMathChoiceText
                            ]}>
                              {mathSubject.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {/* Elective Subjects for Grades 10-12 */}
                  {!isGrade8or9 && renderSubjectsByCategory(
                    currentSubjects.electives, 
                    `Elective Subjects (Choose ${Math.max(0, getMinimumSubjects() - 4)}-${Math.max(0, getMaximumSubjects() - 4)})`
                  )}
                  
                  {/* Optional Subjects for Grades 8-9 */}
                  {isGrade8or9 && renderSubjectsByCategory(currentSubjects.optional, 'Optional Subjects')}
                </ScrollView>

                {/* Subject Selection Progress */}
                <View style={styles.selectionProgress}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: `${Math.min(100, (formData.subjects.length / getMinimumSubjects()) * 100)}%`,
                          backgroundColor: formData.subjects.length >= getMinimumSubjects() ? '#10B981' : theme.colors.primary
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {formData.subjects.length >= getMinimumSubjects() 
                      ? '✅ Minimum subjects selected' 
                      : `${getMinimumSubjects() - formData.subjects.length} more subject${getMinimumSubjects() - formData.subjects.length > 1 ? 's' : ''} needed`
                    }
                  </Text>
                </View>
                {validationErrors.subjects && (
                  <Text style={styles.fieldErrorText}>{validationErrors.subjects}</Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.base,
  },
  keyboardAvoid: {
    flex: 1,
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
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: `${theme.colors.primary}60`,
  },
  saveButtonText: {
    color: theme.colors.base,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  defaultImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  imageEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.base,
  },
  imageHint: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.6,
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.7,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
  },
  fieldErrorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  gradeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    height: 56,
  },
  gradeSelectorActive: {
    borderColor: theme.colors.primary,
  },
  gradeSelectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
  },
  placeholderText: {
    opacity: 0.6,
  },
  gradeList: {
    backgroundColor: theme.colors.base,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}20`,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gradeItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.surfaceLight}80`,
  },
  selectedGradeItem: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  gradeItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  selectedGradeItemText: {
    color: theme.colors.primary,
  },
  subjectsHeader: {
    marginBottom: 16,
  },
  subjectsScrollView: {
    maxHeight: 400,
    marginBottom: 16,
  },
  subjectSection: {
    marginBottom: 24,
  },
  subjectSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
  },
  requiredLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    backgroundColor: '#EF444415',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryGroup: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 8,
    opacity: 0.8,
  },
  subjectsGrid: {
    gap: 8,
  },
  subjectCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  selectedSubjectCheckbox: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.base,
  },
  checkedCheckbox: {
    borderWidth: 2,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  selectedSubjectName: {
    fontWeight: '700',
  },
  mathChoiceContainer: {
    gap: 12,
  },
  mathChoiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 2,
  },
  selectedMathChoice: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.base,
  },
  selectedRadioButton: {
    borderWidth: 2,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.base,
  },
  mathChoiceText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  selectedMathChoiceText: {
    color: theme.colors.base,
    fontWeight: '700',
  },
  selectionProgress: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: `${theme.colors.primary}20`,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.secondary,
    textAlign: 'center',
  },
});