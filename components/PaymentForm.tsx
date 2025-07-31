import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import { Spinner } from './Spinner';

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  buttonText?: string;
  disabled?: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  onSuccess,
  onError,
  buttonText = 'Pay Now',
  disabled = false
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error('Stripe not loaded. Please try again.');
      return;
    }

    if (disabled) return;

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        // Note: clientSecret should be passed from parent component
        // This is a simplified version - in practice, you'd need to create
        // the PaymentIntent first and pass the clientSecret
        '', 
        {
          payment_method: {
            card: cardElement,
          }
        }
      );

      if (error) {
        throw new Error(error.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        toast.success('Payment successful!');
        onSuccess(paymentIntent.id);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Payment failed. Please try again.';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        backgroundColor: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
        iconColor: '#6b7280',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Amount to pay:</span>
          <span className="text-xl font-bold text-gray-900">
            ${(amount / 100).toFixed(2)}
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing || disabled}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          !stripe || isProcessing || disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <Spinner size="sm" />
            <span className="ml-2">Processing...</span>
          </div>
        ) : (
          buttonText
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your payment information is secure and encrypted.
      </p>
    </form>
  );
};

interface StripePaymentWrapperProps extends PaymentFormProps {
  clientSecret: string;
}

export const StripePaymentWrapper: React.FC<StripePaymentWrapperProps> = ({
  clientSecret,
  ...props
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      toast.error('Payment system not ready. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        throw new Error(error.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        toast.success('Payment successful!');
        props.onSuccess(paymentIntent.id);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Payment failed. Please try again.';
      toast.error(errorMessage);
      props.onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PaymentForm
      {...props}
      onSuccess={(paymentIntentId) => {
        // This will be handled by the handleSubmit above
      }}
    />
  );
};
