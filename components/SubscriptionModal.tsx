import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useStripe, SUBSCRIPTION_PLANS } from '@/hooks/useStripe';

const { width: screenWidth } = Dimensions.get('window');

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  context?: 'battle' | 'tutor' | 'general';
}

export default function SubscriptionModal({
  visible,
  onClose,
  context = 'general'
}: SubscriptionModalProps) {
  const { isLoading, initiateSubscription } = useStripe();
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PLANS.MONTHLY.id);

  const handleSubscribe = async () => {
    await initiateSubscription(selectedPlan);
    onClose();
  };

  const getContextTitle = () => {
    switch (context) {
      case 'battle':
        return 'Upgrade to Premium';
      case 'tutor':
        return 'Unlock AI Tutor Sessions';
      default:
        return 'Upgrade to Premium';
    }
  };

  const getContextDescription = () => {
    switch (context) {
      case 'battle':
        return 'Remove ads and earn double Looma Cells in battles!';
      case 'tutor':
        return 'Get unlimited AI tutor sessions to boost your learning!';
      default:
        return 'Enhance your learning experience with premium features!';
    }
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={theme.colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Premium Banner */}
          <View style={styles.premiumBanner}>
            <View style={styles.premiumIconContainer}>
              <Ionicons name="star" size={32} color="#FFD700" />
            </View>
            <Text style={styles.premiumTitle}>{getContextTitle()}</Text>
            <Text style={styles.premiumDescription}>{getContextDescription()}</Text>
          </View>

          {/* Subscription Plans */}
          <ScrollView style={styles.plansContainer} showsVerticalScrollIndicator={false}>
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
          </ScrollView>

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

          {/* Subscribe Button */}
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

          {/* Terms and Privacy */}
          <Text style={styles.termsText}>
            By subscribing, you agree to our Terms of Service and Privacy Policy. 
            Subscription will automatically renew unless cancelled at least 24 hours before the end of the current period.
          </Text>
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
  header: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceLight,
  },
  premiumBanner: {
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginBottom: 8,
  },
  premiumDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.secondary,
    opacity: 0.7,
    textAlign: 'center',
  },
  plansContainer: {
    maxHeight: 400,
    marginBottom: 16,
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
  termsText: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.secondary,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 16,
  },
});