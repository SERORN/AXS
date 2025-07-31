import React from 'react';
import { ToastContainer, toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Custom toast configuration
const defaultToastOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// Notification functions
export const notify = {
  success: (message: string, options?: ToastOptions) => 
    toast.success(message, { ...defaultToastOptions, ...options }),
  
  error: (message: string, options?: ToastOptions) => 
    toast.error(message, { ...defaultToastOptions, ...options }),
  
  info: (message: string, options?: ToastOptions) => 
    toast.info(message, { ...defaultToastOptions, ...options }),
  
  warning: (message: string, options?: ToastOptions) => 
    toast.warning(message, { ...defaultToastOptions, ...options }),

  payment: {
    processing: () => toast.info('🔄 Processing payment...', { autoClose: false }),
    success: (amount: number) => toast.success(`✅ Payment of $${(amount / 100).toFixed(2)} successful!`),
    failed: () => toast.error('❌ Payment failed. Please try again.'),
  },

  subscription: {
    success: (planName: string) => toast.success(`🎉 Successfully subscribed to ${planName}!`),
    expired: (planName: string) => toast.warning(`⏰ Your ${planName} subscription has expired.`),
    cancelSuccess: () => toast.success('📝 Subscription canceled successfully.'),
  },

  wallet: {
    topUpSuccess: (amount: number) => toast.success(`💰 Added $${amount} to your wallet!`),
    lowBalance: () => toast.warning('⚠️ Your wallet balance is low. Consider adding funds.'),
    insufficientFunds: () => toast.error('💳 Insufficient funds. Please top up your wallet.'),
  },

  auth: {
    otpSent: () => toast.info('📱 OTP sent to your phone!'),
    loginSuccess: () => toast.success('👋 Welcome back!'),
    logoutSuccess: () => toast.success('👋 Logged out successfully!'),
    roleUpdated: (role: string) => toast.success(`🔄 Role updated to ${role}`),
  },

  admin: {
    userRoleUpdated: (userName: string, role: string) => 
      toast.success(`👤 ${userName}'s role updated to ${role}`),
    planCreated: (planName: string) => 
      toast.success(`📋 Plan "${planName}" created successfully!`),
    planUpdated: (planName: string) => 
      toast.success(`📝 Plan "${planName}" updated successfully!`),
    planDeleted: (planName: string) => 
      toast.success(`🗑️ Plan "${planName}" deleted successfully!`),
  },
};

// Toast Container Component
export const NotificationContainer: React.FC = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      style={{ zIndex: 9999 }}
    />
  );
};

// Hook for notifications
export const useNotifications = () => {
  return notify;
};
