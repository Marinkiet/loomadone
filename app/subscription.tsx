import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useStripe, SUBSCRIPTION_PLANS } from '@/hooks/useStripe';
import { useAuth } from '@/hooks/useAuth';

const { width: screenWidth } = Dimensions.get('window');

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const { isSubscribed, isLoading, currentPlan, initiateSubscription, cancelSubscription } = useStripe();
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PLANS.MONTHLY.id);

  const handleSubscribe = async () => {
    await initiateSubscription(selectedPlan);
  };

  const handleCancel = async () => {
    await cancelSubscription();
  };

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
        <Text style={styles.headerTitle}>Premium Subscription</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Premium Banner */}
        <View style={styles.premiumBanner}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop' }}
            style={styles.bannerImage}
          />
          <View style={styles.bannerOverlay}>
            <View style={styles.premiumIconContainer}>
              <Ionicons name="star" size={32} color="#FFD700" />
            </View>
            <Text style={styles.premiumTitle}>
              {isSubscribed ? 'You\'re a Premium Member!' : 'Upgrade to Premium'}
            </Text>
            <Text style={styles.premiumDescription}>
              {isSubscribed 
                ? `You're currently on the ${currentPlan === SUBSCRIPTION_PLANS.ANNUAL.id ? 'Annual' : 'Monthly'} plan.`
                : 'Unlock exclusive features and enhance your learning experience!'}
            </Text>
          </View>
        </View>

        {/* Current Status */}
        {isSubscribed && (
          <View style={styles.statusCard}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            <Text style={styles.statusText}>
              Your premium subscription is active
            </Text>
          </View>
        )}

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Premium Benefits</Text>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIconContainer}>
                <Ionicons name="bulb" size={24} color={theme.colors.accent} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Double Looma Cells</Text>
                <Text style={styles.benefitDescription}>
                  Earn twice as many Looma Cells for every activity you complete
                </Text>
              </View>
            </View>
            
            <View style={styles.benefitItem}>
              <View style={styles.benefitIconContainer}>
                <Ionicons name="videocam" size={24} color="#10B981" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Unlimited AI Tutor Sessions</Text>
                <Text style={styles.benefitDescription}>
                  Get personalized help from our AI tutors whenever you need it
                </Text>
              </View>
            </View>
            
            <View style={styles.benefitItem}>
              <View style={styles.benefitIconContainer}>
                <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Ad-Free Experience</Text>
                <Text style={styles.benefitDescription}>
                  Enjoy learning without any interruptions from advertisements
                </Text>
              </View>
            </View>
            
            <View style={styles.benefitItem}>
              <View style={styles.benefitIconContainer}>
                <Ionicons name="book" size={24} color="#8B5CF6" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Premium Learning Content</Text>
                <Text style={styles.benefitDescription}>
                  Access exclusive learning materials and advanced topics
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Subscription Plans */}
        {!isSubscribed && (
          <View style={styles.plansSection}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            
            {/* Monthly Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === SUBSCRIPTION_PLANS.MONTHLY.id && styles.selectedPlanCard
              ]}
              onPress={() => setSelectedPlan(SUBSCRIPTION_PLANS.MONTHLY.id)}
              activeOpacity={0.8}
            >
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{SUBSCRIPTION_PLANS.MONTHLY.name}</Text>
                  <Text style={styles.planPrice}>{SUBSCRIPTION_PLANS.MONTHLY.price}</Text>
                </View>
                <View style={styles.radioButton}>
                  {selectedPlan === SUBSCRIPTION_PLANS.MONTHLY.id && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
              </View>

              <View style={styles.planFeatures}>
                {SUBSCRIPTION_PLANS.MONTHLY.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>

            {/* Annual Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === SUBSCRIPTION_PLANS.ANNUAL.id && styles.selectedPlanCard,
                styles.bestValueCard
              ]}
              onPress={() => setSelectedPlan(SUBSCRIPTION_PLANS.ANNUAL.id)}
              activeOpacity={0.8}
            >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>BEST VALUE</Text>
              </View>
              
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{SUBSCRIPTION_PLANS.ANNUAL.name}</Text>
                  <Text style={styles.planPrice}>{SUBSCRIPTION_PLANS.ANNUAL.price}</Text>
                </View>
                <View style={styles.radioButton}>
                  {selectedPlan === SUBSCRIPTION_PLANS.ANNUAL.id && (
                    <View style={styles.radioButtonSelected} />
                  )}
                </View>
              </View>

              <View style={styles.planFeatures}>
                {SUBSCRIPTION_PLANS.ANNUAL.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Payment Methods */}
        <View style={styles.paymentMethods}>
          <Text style={styles.paymentMethodsTitle}>Secure Payment via</Text>
          <View style={styles.paymentLogos}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/6289065/pexels-photo-6289065.jpeg?auto=compress&cs=tinysrgb&w=40&h=20&fit=crop' }}
              style={styles.paymentLogo}
              resizeMode="contain"
            />
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/6289066/pexels-photo-6289066.jpeg?auto=compress&cs=tinysrgb&w=40&h=20&fit=crop' }}
              style={styles.paymentLogo}
              resizeMode="contain"
            />
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/6289067/pexels-photo-6289067.jpeg?auto=compress&cs=tinysrgb&w=40&h=20&fit=crop' }}
              style={styles.paymentLogo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Action Button */}
        {isSubscribed ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.error} />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                <Text style={styles.cancelButtonText}>
                  Cancel Subscription
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleSubscribe}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.base} />
            ) : (
              <>
                <Ionicons name="card" size={20} color={theme.colors.base} />
                <Text style={styles.subscribeButtonText}>
                  Subscribe Now
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Terms and Privacy */}
        <Text style={styles.termsText}>
          By subscribing, you agree to our Terms of Service and Privacy Policy. 
          Subscription will automatically renew unless cancelled at least 24 hours before the end of the current period.
        </Text>
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
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  premiumBanner: {
    position: 'relative',
    height: 200,
    marginBottom: 24,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  premiumIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.base,
    marginBottom: 8,
    textAlign: 'center',
  },
  premiumDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.base,
    opacity: 0.9,
    textAlign: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.success}15`,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.success,
    flex: 1,
  },
  benefitsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  benefitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    lineHeight: 20,
  },
  plansSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}08`,
  },
  bestValueCard: {
    borderColor: '#FFD700',
    backgroundColor: '#FFF7ED',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  planFeatures: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    flex: 1,
  },
  paymentMethods: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  paymentMethodsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    marginBottom: 8,
  },
  paymentLogos: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  paymentLogo: {
    width: 40,
    height: 20,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 16,
    gap: 8,
    marginBottom: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.base,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.base,
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 16,
    gap: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.colors.error,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.error,
  },
  termsText: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.secondary,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
    marginBottom: 40,
  },
});