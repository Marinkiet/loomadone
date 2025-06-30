import { useState, createContext, useContext } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    id: 'loomalearn_premium_monthly',
    name: 'Monthly Premium',
    price: 'R15/month',
    description: 'Remove ads + Double Looma Super Cells',
    features: [
      'Ad-free experience',
      'Double Looma Cells on all activities',
      'Unlimited AI tutor sessions',
      'Premium learning content'
    ]
  },
  ANNUAL: {
    id: 'loomalearn_premium_annual',
    name: 'Annual Premium',
    price: 'R150/year',
    description: 'Save 17% with annual billing',
    features: [
      'All monthly features',
      'Save 17% compared to monthly',
      'Priority support',
      'Early access to new features'
    ]
  }
};

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const STRIPE_API_URL = process.env.EXPO_PUBLIC_STRIPE_API_URL || 'https://api.stripe.com/v1';
const PAYWAYY_MERCHANT_ID = process.env.EXPO_PUBLIC_PAYWAYY_MERCHANT_ID;

interface StripeContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  currentPlan: string | null;
  initiateSubscription: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<boolean>;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export function useStripe() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
}

export function StripeProvider({ children }: { children: React.ReactNode }) {
  const { user, updateProfile } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  // Check if user is subscribed based on user profile data
  const checkSubscriptionStatus = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        setIsSubscribed(false);
        return false;
      }

      // In a real implementation, you would verify the subscription status with your backend
      // For now, we'll check if the user has the is_premium flag set
      const isPremium = user.privacy_settings?.is_premium === true;
      setIsSubscribed(isPremium);
      
      if (isPremium) {
        // Get the current plan from user data
        setCurrentPlan(user.privacy_settings?.subscription_plan || SUBSCRIPTION_PLANS.MONTHLY.id);
      } else {
        setCurrentPlan(null);
      }

      return isPremium;
    } catch (error: any) {
      console.error('Error checking subscription status:', error);
      setError('Failed to check subscription status');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Initiate a subscription
  const initiateSubscription = async (planId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error('User not authenticated');
      }

      // In a real implementation, you would create a checkout session with your backend
      // For this example, we'll simulate the process
      
      // 1. Validate the plan ID
      const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      // 2. Create a checkout session (simulated)
      console.log(`Creating checkout session for plan: ${planId}`);
      
      // 3. Simulate a successful subscription
      // In a real implementation, this would be handled by a webhook
      const updatedSettings = {
        ...user.privacy_settings,
        is_premium: true,
        subscription_plan: planId,
        subscription_start_date: new Date().toISOString()
      };
      
      // Update user profile
      await updateProfile({
        privacy_settings: updatedSettings
      });
      
      // Update local state
      setIsSubscribed(true);
      setCurrentPlan(planId);
      
      // Show success message
      Alert.alert(
        '🎉 Subscription Successful!',
        'Welcome to LoomaLearn Premium! You now have access to all premium features.',
        [{ text: 'Great!', style: 'default' }]
      );
      
      // Track analytics event
      console.log('ANALYTICS: Subscription_Success', { plan: planId });
      
    } catch (error: any) {
      console.error('Error initiating subscription:', error);
      setError(error.message || 'Failed to initiate subscription');
      
      // Show error message
      Alert.alert(
        'Subscription Failed',
        'There was a problem processing your subscription. Please try again later.',
        [{ text: 'OK', style: 'default' }]
      );
      
      // Track analytics event
      console.log('ANALYTICS: Subscription_Failed', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel a subscription
  const cancelSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error('User not authenticated');
      }

      // In a real implementation, you would cancel the subscription with your backend
      // For this example, we'll simulate the process
      
      // 1. Simulate cancellation
      console.log('Cancelling subscription');
      
      // 2. Update user profile
      const updatedSettings = {
        ...user.privacy_settings,
        is_premium: false,
        subscription_plan: null,
        subscription_end_date: new Date().toISOString()
      };
      
      await updateProfile({
        privacy_settings: updatedSettings
      });
      
      // Update local state
      setIsSubscribed(false);
      setCurrentPlan(null);
      
      // Show success message
      Alert.alert(
        'Subscription Cancelled',
        'Your subscription has been cancelled. You will continue to have access until the end of your billing period.',
        [{ text: 'OK', style: 'default' }]
      );
      
      // Track analytics event
      console.log('ANALYTICS: Subscription_Cancelled');
      
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      setError(error.message || 'Failed to cancel subscription');
      
      // Show error message
      Alert.alert(
        'Cancellation Failed',
        'There was a problem cancelling your subscription. Please try again later.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StripeContext.Provider
      value={{
        isSubscribed,
        isLoading,
        error,
        currentPlan,
        initiateSubscription,
        cancelSubscription,
        checkSubscriptionStatus,
      }}
    >
      {children}
    </StripeContext.Provider>
  );
}