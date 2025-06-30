import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '@/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function ThemeTestScreen() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [progress, setProgress] = useState(75);

  const colorPalette = [
    { name: 'Primary', color: theme.colors.primary, description: 'Primary brand color' },
    { name: 'Secondary', color: theme.colors.secondary, description: 'Secondary accent' },
    { name: 'Success', color: theme.colors.success, description: 'Success states' },
    { name: 'Error', color: theme.colors.error, description: 'Error states' },
    { name: 'Warning', color: theme.colors.warning, description: 'Warning states' },
    { name: 'Info', color: theme.colors.info, description: 'Info states' },
  ];

  const gameElements = [
    { id: 'health', label: 'Health Bar', value: 85, color: theme.colors.success },
    { id: 'mana', label: 'Mana Bar', value: 60, color: theme.colors.info },
    { id: 'xp', label: 'XP Bar', value: 40, color: theme.colors.warning },
  ];

  const handleCardPress = (cardId: string) => {
    setSelectedCard(selectedCard === cardId ? null : cardId);
  };

  const incrementProgress = () => {
    setProgress(prev => Math.min(100, prev + 10));
  };

  const decrementProgress = () => {
    setProgress(prev => Math.max(0, prev - 10));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>
          🎮 Theme Test
        </Text>
        
        <View style={styles.themeToggle}>
          <Text style={[styles.toggleLabel, { color: theme.colors.text }]}>Dark</Text>
          <Switch
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            trackColor={{ false: theme.colors.surface, true: theme.colors.primary }}
            thumbColor={isDarkMode ? theme.colors.secondary : theme.colors.text}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Color Palette Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🎨 Color Palette
          </Text>
          
          <View style={styles.colorGrid}>
            {colorPalette.map((item, index) => (
              <View key={index} style={[styles.colorCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[styles.colorSwatch, { backgroundColor: item.color }]} />
                <Text style={[styles.colorName, { color: theme.colors.text }]}>{item.name}</Text>
                <Text style={[styles.colorCode, { color: theme.colors.textSecondary }]}>{item.color}</Text>
                <Text style={[styles.colorDescription, { color: theme.colors.text }]}>{item.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Interactive Buttons Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🎯 Interactive Elements
          </Text>
          
          <View style={styles.buttonsGrid}>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                Primary Action
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.colors.success }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                Success Action
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.colors.warning }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: theme.colors.background }]}>
                Warning Action
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.colors.error }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                Danger Action
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Game UI Elements */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🎮 UI Elements
          </Text>
          
          <View style={[styles.gameUICard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.gameUITitle, { color: theme.colors.primary }]}>
              Progress Bars
            </Text>
            
            {gameElements.map((element) => (
              <View key={element.id} style={styles.statRow}>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                  {element.label}
                </Text>
                <View style={styles.statBarContainer}>
                  <View style={[styles.progressBar, { backgroundColor: theme.colors.background }]}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          backgroundColor: element.color,
                          width: `${element.value}%`,
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.statValue, { color: element.color }]}>
                    {element.value}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Interactive Cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🃏 Interactive Cards
          </Text>
          
          <View style={styles.cardsGrid}>
            {['card1', 'card2', 'card3'].map((cardId, index) => (
              <TouchableOpacity
                key={cardId}
                style={[
                  styles.card,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  selectedCard === cardId && { borderColor: theme.colors.primary, borderWidth: 2 }
                ]}
                onPress={() => handleCardPress(cardId)}
                activeOpacity={0.8}
              >
                <View style={[styles.cardIcon, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons 
                    name={index === 0 ? 'flash' : index === 1 ? 'shield' : 'star'} 
                    size={24} 
                    color={theme.colors.background} 
                  />
                </View>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  Card {index + 1}
                </Text>
                <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
                  {selectedCard === cardId ? 'Selected!' : 'Tap to select'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress Control */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            📊 Progress Control
          </Text>
          
          <View style={[styles.progressCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.progressLabel, { color: theme.colors.text }]}>
              Experience Points: {progress}%
            </Text>
            
            <View style={[styles.progressBar, { backgroundColor: theme.colors.background, height: 12 }]}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${progress}%`,
                    backgroundColor: theme.colors.primary,
                  }
                ]} 
              />
            </View>
            
            <View style={styles.progressControls}>
              <TouchableOpacity 
                style={[styles.progressButton, { backgroundColor: theme.colors.error }]}
                onPress={decrementProgress}
                activeOpacity={0.8}
              >
                <Ionicons name="remove" size={20} color={theme.colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.progressButton, { backgroundColor: theme.colors.success }]}
                onPress={incrementProgress}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color={theme.colors.background} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Typography Showcase */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            📝 Typography
          </Text>
          
          <View style={[styles.typographyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.displayText, { color: theme.colors.primary }]}>
              Display Text
            </Text>
            <Text style={[styles.titleText, { color: theme.colors.secondary }]}>
              Title Text
            </Text>
            <Text style={[styles.headingText, { color: theme.colors.text }]}>
              Heading Text
            </Text>
            <Text style={[styles.bodyText, { color: theme.colors.text }]}>
              Body text with proper line height and spacing for readability in the interface.
            </Text>
            <Text style={[styles.captionText, { color: theme.colors.textSecondary }]}>
              Caption text for additional information
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCard: {
    width: (screenWidth - 64) / 2,
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginBottom: 8,
  },
  colorName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  colorCode: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  colorDescription: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonsGrid: {
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  gameUICard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  gameUITitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statRow: {
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  statBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 40,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: (screenWidth - 64) / 3,
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  progressCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  progressControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  progressButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typographyCard: {
    padding: 16,
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  displayText: {
    fontSize: 32,
    fontWeight: '900',
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
  },
  headingText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bodyText: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 22,
  },
  captionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});