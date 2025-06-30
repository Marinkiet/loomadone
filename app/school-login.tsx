import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

// Mock school data
const mockSchools = [
  { id: '1', name: 'Westfield High School', code: 'WHS2024' },
  { id: '2', name: 'Central Academy', code: 'CA2024' },
  { id: '3', name: 'Riverside School', code: 'RS2024' },
  { id: '4', name: 'Oak Valley High', code: 'OVH2024' },
  { id: '5', name: 'Pine Ridge Academy', code: 'PRA2024' },
  { id: '6', name: 'Maple Grove School', code: 'MGS2024' },
];

export default function SchoolLoginScreen() {
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [studentNumber, setStudentNumber] = useState('');
  const [showSchoolList, setShowSchoolList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const isFormValid = selectedSchool && studentNumber.trim() !== '';

  const handleSchoolSelect = (school: any) => {
    setSelectedSchool(school);
    setShowSchoolList(false);
  };

  const handleLogin = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    
    try {
      // Simulate login process
      await new Promise(resolve => setTimeout(resolve, 1500));
      await login();
      
      Alert.alert(
        '🎓 School Login Successful!',
        `Welcome to LoomaLearn, ${selectedSchool.name} student!`,
        [
          {
            text: 'Start Learning!',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'School login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHelp = () => {
    Alert.alert(
      'Need Help?',
      'Contact your teacher or school administrator for your student number and school code.\n\nYou can also email support@loomalearn.com for assistance.',
      [{ text: 'OK' }]
    );
  };

  const navigateBack = () => {
    router.back();
  };

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
            
            <TouchableOpacity 
              style={styles.helpButton}
              onPress={handleHelp}
              activeOpacity={0.7}
            >
              <Ionicons name="help-circle-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.schoolIcon}>
              <Ionicons name="school" size={32} color={theme.colors.base} />
            </View>
            <Text style={styles.title}>Login with Your School</Text>
            <Text style={styles.subtitle}>
              Connect with your school account to access personalized learning content 📚
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* School Selector */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Select Your School</Text>
              <TouchableOpacity
                style={[styles.schoolSelector, showSchoolList && styles.schoolSelectorActive]}
                onPress={() => setShowSchoolList(!showSchoolList)}
                activeOpacity={0.8}
              >
                <Ionicons name="school-outline" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <Text style={[
                  styles.schoolSelectorText,
                  !selectedSchool && styles.placeholderText
                ]}>
                  {selectedSchool ? selectedSchool.name : 'Choose your school'}
                </Text>
                <Ionicons 
                  name={showSchoolList ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.colors.secondary} 
                />
              </TouchableOpacity>

              {/* School List */}
              {showSchoolList && (
                <View style={styles.schoolList}>
                  {mockSchools.map((school) => (
                    <TouchableOpacity
                      key={school.id}
                      style={[
                        styles.schoolItem,
                        selectedSchool?.id === school.id && styles.selectedSchoolItem
                      ]}
                      onPress={() => handleSchoolSelect(school)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.schoolItemText,
                        selectedSchool?.id === school.id && styles.selectedSchoolItemText
                      ]}>
                        {school.name}
                      </Text>
                      <Text style={styles.schoolCodeText}>Code: {school.code}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Student Number Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Student Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={theme.colors.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your student number"
                  placeholderTextColor={`${theme.colors.secondary}60`}
                  value={studentNumber}
                  onChangeText={setStudentNumber}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginButton, !isFormValid && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={!isFormValid || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loginButtonText}>Connecting...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color={theme.colors.base} />
                  <Text style={styles.loginButtonText}>Login with School</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Help Section */}
            <View style={styles.helpSection}>
              <View style={styles.helpCard}>
                <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
                <View style={styles.helpContent}>
                  <Text style={styles.helpTitle}>Need Help?</Text>
                  <Text style={styles.helpText}>
                    Ask your teacher for your student number and school code, or contact support for assistance.
                  </Text>
                </View>
              </View>
            </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  schoolIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
    paddingBottom: 20,
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
  schoolSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    height: 56,
  },
  schoolSelectorActive: {
    borderColor: theme.colors.primary,
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.7,
  },
  schoolSelectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
  },
  placeholderText: {
    opacity: 0.6,
  },
  schoolList: {
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
    maxHeight: 200,
  },
  schoolItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.surfaceLight}80`,
  },
  selectedSchoolItem: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  schoolItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  selectedSchoolItemText: {
    color: theme.colors.primary,
  },
  schoolCodeText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.6,
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
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    height: 56,
    marginBottom: 32,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: `${theme.colors.primary}60`,
    shadowOpacity: 0.1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.base,
  },
  helpSection: {
    marginTop: 20,
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: `${theme.colors.primary}08`,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}20`,
  },
  helpContent: {
    flex: 1,
    marginLeft: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  helpText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    lineHeight: 20,
  },
});