import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

// Mock data
const grades = [
  'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
];

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

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    grade: '',
    subjects: [] as string[],
    mathChoice: '' as string,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showGradeList, setShowGradeList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    general: '',
  });
  const { signUp } = useAuth();

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation function
  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

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

  const isFormValid = 
    formData.name.trim() !== '' &&
    formData.email.trim() !== '' &&
    validateEmail(formData.email) &&
    formData.password.trim() !== '' &&
    validatePassword(formData.password) &&
    formData.confirmPassword.trim() !== '' &&
    formData.password === formData.confirmPassword &&
    formData.grade !== '' &&
    getMinimumSubjects() <= formData.subjects.length;

  const getCurrentSubjects = () => {
    if (!formData.grade) return { compulsory: [], mathChoice: [], electives: [], optional: [] };
    return subjectsByGrade[formData.grade as keyof typeof subjectsByGrade] || { compulsory: [], mathChoice: [], electives: [], optional: [] };
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors when user starts typing
    if (field === 'email' && validationErrors.email) {
      setValidationErrors(prev => ({ ...prev, email: '' }));
    }
    if (field === 'password' && validationErrors.password) {
      setValidationErrors(prev => ({ ...prev, password: '' }));
    }
    if (field === 'confirmPassword' && validationErrors.confirmPassword) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
    if (validationErrors.general) {
      setValidationErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const handleGradeSelect = (grade: string) => {
    setFormData(prev => ({ 
      ...prev, 
      grade,
      subjects: [], // Reset subjects when grade changes
      mathChoice: ''
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

  const handleMathChoiceSelect = (mathSubject: string) => {
    setFormData(prev => ({
      ...prev,
      mathChoice: mathSubject,
      subjects: prev.subjects.filter(s => s !== 'Mathematics' && s !== 'Mathematical Literacy').concat([mathSubject])
    }));
  };

  const validateForm = () => {
    const errors = {
      email: '',
      password: '',
      confirmPassword: '',
      general: '',
    };

    // Validate email
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address (e.g., user@example.com)';
    }

    // Validate password
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      errors.password = 'Password must be at least 6 characters long';
    }

    // Validate confirm password
    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return !errors.email && !errors.password && !errors.confirmPassword;
  };

  const handleRegister = async () => {
    // Clear previous general errors
    setValidationErrors(prev => ({ ...prev, general: '' }));

    if (!validateForm() || !isFormValid) return;

    setIsLoading(true);
    
    try {
      await signUp(formData.email, formData.password, {
        full_name: formData.name,
        grade: formData.grade,
        subjects: formData.subjects,
      });
      
      Alert.alert(
        '🎉 Welcome to LoomaLearn!',
        'Your account has been created successfully! Ready to start your learning adventure?',
        [
          {
            text: 'Let\'s Start!',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error signing up:', error);
      
      let errorMessage = 'Please try again.';
      
      // Handle specific error types
      if (error.message?.includes('invalid format')) {
        setValidationErrors(prev => ({ 
          ...prev, 
          email: 'Please enter a valid email address (e.g., user@example.com)' 
        }));
        return;
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        setValidationErrors(prev => ({ 
          ...prev, 
          password: 'Password must be at least 6 characters long' 
        }));
        return;
      } else if (error.message?.includes('you can only request this after')) {
        const match = error.message.match(/(\d+)\s*s/);
        const seconds = match ? match[1] : '21';
        errorMessage = `Please wait ${seconds} seconds before trying again for security purposes.`;
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please wait a moment before trying again.';
      } else if (error.message?.includes('already registered')) {
        setValidationErrors(prev => ({ 
          ...prev, 
          email: 'This email is already registered. Please use a different email or try logging in.' 
        }));
        return;
      } else {
        errorMessage = error.message || 'Registration failed. Please try again.';
      }
      
      setValidationErrors(prev => ({ ...prev, general: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/login');
  };

  const navigateBack = () => {
    router.back();
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

  const renderMathChoice = (mathOptions: any[]) => {
    if (mathOptions.length === 0) return null;

    return (
      <View style={styles.subjectSection}>
        <View style={styles.subjectSectionHeader}>
          <Text style={styles.subjectSectionTitle}>Mathematics (Choose One)</Text>
          <Text style={styles.requiredLabel}>Required</Text>
        </View>
        
        <View style={styles.mathChoiceContainer}>
          {mathOptions.map((mathSubject) => (
            <TouchableOpacity
              key={mathSubject.name}
              style={[
                styles.mathChoiceOption,
                { borderColor: mathSubject.color },
                formData.mathChoice === mathSubject.name && [
                  styles.selectedMathChoice,
                  { backgroundColor: mathSubject.color }
                ]
              ]}
              onPress={() => handleMathChoiceSelect(mathSubject.name)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.radioButton,
                { borderColor: mathSubject.color },
                formData.mathChoice === mathSubject.name && [
                  styles.selectedRadioButton,
                  { backgroundColor: mathSubject.color }
                ]
              ]}>
                {formData.mathChoice === mathSubject.name && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              
              <Ionicons 
                name={mathSubject.icon as any} 
                size={24} 
                color={formData.mathChoice === mathSubject.name ? theme.colors.base : mathSubject.color} 
              />
              <Text style={[
                styles.mathChoiceText,
                { color: mathSubject.color },
                formData.mathChoice === mathSubject.name && styles.selectedMathChoiceText
              ]}>
                {mathSubject.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const currentSubjects = getCurrentSubjects();
  const isGrade8or9 = ['Grade 8', 'Grade 9'].includes(formData.grade);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={navigateBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Image 
            source={require('@/assets/images/13.png')}
            style={styles.loomaLogo}
            resizeMode="contain"
          />
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>
              Join thousands of South African learners on their educational journey! 🇿🇦
            </Text>
          </View>

          {/* General Error Message */}
          {validationErrors.general && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorText}>{validationErrors.general}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your full name"
                  placeholderTextColor={`${theme.colors.secondary}60`}
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[
                styles.inputWrapper,
                validationErrors.email && styles.inputWrapperError
              ]}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your email (e.g., user@example.com)"
                  placeholderTextColor={`${theme.colors.secondary}60`}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {validationErrors.email && (
                <Text style={styles.fieldErrorText}>{validationErrors.email}</Text>
              )}
            </View>

            {/* Grade Selector */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Grade</Text>
              <TouchableOpacity
                style={[styles.gradeSelector, showGradeList && styles.gradeSelectorActive]}
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
                  {!isGrade8or9 && renderMathChoice(currentSubjects.mathChoice)}
                  
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
              </View>
            )}

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[
                styles.inputWrapper,
                validationErrors.password && styles.inputWrapperError
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  placeholder="Create a password (min. 6 characters)"
                  placeholderTextColor={`${theme.colors.secondary}60`}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={theme.colors.secondary} 
                  />
                </TouchableOpacity>
              </View>
              {validationErrors.password && (
                <Text style={styles.fieldErrorText}>{validationErrors.password}</Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={[
                styles.inputWrapper,
                validationErrors.confirmPassword && styles.inputWrapperError
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  placeholder="Confirm your password"
                  placeholderTextColor={`${theme.colors.secondary}60`}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={theme.colors.secondary} 
                  />
                </TouchableOpacity>
              </View>
              {validationErrors.confirmPassword && (
                <Text style={styles.fieldErrorText}>{validationErrors.confirmPassword}</Text>
              )}
            </View>

            {/* Register Button */}
            <TouchableOpacity 
              style={[styles.registerButton, !isFormValid && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={!isFormValid || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.registerButtonText}>Creating Account...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color={theme.colors.base} />
                  <Text style={styles.registerButtonText}>Create Account</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginSection}>
            <Text style={styles.loginPrompt}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin} activeOpacity={0.7}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loomaLogo: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.secondary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
    flex: 1,
  },
  formContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
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
  passwordInput: {
    paddingRight: 12,
  },
  passwordToggle: {
    padding: 4,
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
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    height: 56,
    marginTop: 12,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonDisabled: {
    backgroundColor: `${theme.colors.primary}60`,
    shadowOpacity: 0.1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.base,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  loginPrompt: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});