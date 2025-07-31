import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Crown, Check, Loader2 } from 'lucide-react';
import { Plan } from '../types';
import { getPlans, createPaymentIntent, subscribeToPlan } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { StripePaymentWrapper } from './PaymentForm';

interface PlanCardProps {
  plan: Plan;
  onSelect: (plan: Plan) => void;
  isSelected: boolean;
  isSubscribed: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onSelect, isSelected, isSubscribed }) => {
  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'premium': return '👑';
      case 'lounge': return '🏢';
      case 'parking': return '🚗';
      default: return '📱';
    }
  };

  const getPlanColor = (type: string) => {
    switch (type) {
      case 'premium': return 'border-purple-500 bg-purple-50';
      case 'lounge': return 'border-blue-500 bg-blue-50';
      case 'parking': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div
      className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : getPlanColor(plan.type)
      } ${isSubscribed ? 'opacity-60' : 'hover:shadow-md'}`}
      onClick={() => !isSubscribed && onSelect(plan)}
    >
      {isSubscribed && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          Active
        </div>
      )}
      
      <div className="text-center">
        <div className="text-4xl mb-2">{getPlanIcon(plan.type)}</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <div className="mb-4">
          <span className="text-3xl font-bold text-gray-900">
            ${plan.price}
          </span>
          <span className="text-gray-600">/{plan.duration} days</span>
        </div>
      </div>

      <div className="space-y-3">
        {plan.benefits.map((benefit, index) => (
          <div key={index} className="flex items-center">
            <Check className="w-4 h-4 text-green-500 mr-2" />
            <span className="text-sm text-gray-700">{benefit}</span>
          </div>
        ))}
      </div>

      {isSubscribed && (
        <div className="mt-4 text-center text-sm text-green-600 font-medium">
          ✓ Currently subscribed
        </div>
      )}
    </div>
  );
};

export const PlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const plansData = await getPlans();
      setPlans(plansData.filter(plan => plan.isActive));
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  };

  const isUserSubscribedToPlan = (planId: string) => {
    return user?.activePlans?.some(activePlan => activePlan._id === planId) || false;
  };

  const handlePlanSelect = async (plan: Plan) => {
    if (isUserSubscribedToPlan(plan._id)) {
      toast.info('You are already subscribed to this plan');
      return;
    }

    setSelectedPlan(plan);
    setIsProcessingPayment(true);

    try {
      // Create payment intent for the plan
      const response = await createPaymentIntent(
        plan.price * 100, // Convert to cents
        'plan_subscription',
        plan._id
      );

      setClientSecret(response.data!.clientSecret);
      setPaymentIntentId(response.data!.paymentIntentId);
    } catch (error) {
      toast.error('Failed to initiate payment');
      setSelectedPlan(null);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!selectedPlan) return;

    try {
      // Subscribe to the plan
      await subscribeToPlan(selectedPlan._id, paymentIntentId);
      
      // Update user context with new plan
      updateUser({
        activePlans: [...(user?.activePlans || []), selectedPlan]
      });

      toast.success(`Successfully subscribed to ${selectedPlan.name}!`);
      setSelectedPlan(null);
      setClientSecret('');
      setPaymentIntentId('');
      
      // Refresh plans to update UI
      loadPlans();
    } catch (error) {
      toast.error('Subscription failed. Please contact support.');
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
    setSelectedPlan(null);
    setClientSecret('');
    setPaymentIntentId('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Choose Your Membership Plan
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Unlock premium features and enhance your AXS experience with our membership plans.
            Get access to exclusive lounges, priority parking, and much more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              onSelect={handlePlanSelect}
              isSelected={selectedPlan?._id === plan._id}
              isSubscribed={isUserSubscribedToPlan(plan._id)}
            />
          ))}
        </div>

        {/* Payment Modal */}
        {selectedPlan && clientSecret && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Subscribe to {selectedPlan.name}
                </h3>
                <p className="text-gray-600">
                  Complete your payment to activate your membership
                </p>
              </div>

              <StripePaymentWrapper
                amount={selectedPlan.price * 100}
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                buttonText={`Subscribe for $${selectedPlan.price}`}
                disabled={isProcessingPayment}
              />

              <button
                onClick={() => {
                  setSelectedPlan(null);
                  setClientSecret('');
                  setPaymentIntentId('');
                }}
                className="w-full mt-4 py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => navigate('/home')}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
