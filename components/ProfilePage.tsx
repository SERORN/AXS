import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Crown, Wallet, Settings, LogOut, CreditCard, Calendar, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getWalletBalance, getUserPlans } from '../services/api';
import { Plan, WalletBalance } from '../types';
import { notify } from '../utils/notifications';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [activePlans, setActivePlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [balanceData, plansData] = await Promise.all([
        getWalletBalance(),
        getUserPlans()
      ]);
      
      setBalance(balanceData);
      setActivePlans(plansData);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    notify.auth.logoutSuccess();
    navigate('/auth');
  };

  const formatPlanExpiry = (plan: Plan) => {
    // This would typically come from the backend as expiry date
    // For now, we'll calculate based on plan duration
    const now = new Date();
    const expiryDate = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000);
    return expiryDate.toLocaleDateString();
  };

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'premium': return '👑';
      case 'lounge': return '🏢';
      case 'parking': return '🚗';
      default: return '📱';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your profile</p>
          <button
            onClick={() => navigate('/auth')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 px-6 pt-12 pb-8">
        <div className="flex items-center space-x-4 text-white">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-blue-100">{user.email}</p>
            <p className="text-blue-100 text-sm">{user.phone}</p>
            {isAdmin && (
              <div className="flex items-center mt-1">
                <Shield className="w-4 h-4 mr-1" />
                <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  Administrator
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 -mt-4">
        {/* Balance Card */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Wallet Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : balance?.formattedBalance || `$${(balance?.balance || 0).toFixed(2)}`}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <button
            onClick={() => navigate('/wallet')}
            className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Manage Wallet
          </button>
        </div>

        {/* Active Plans */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Active Plans</h2>
            <Crown className="w-5 h-5 text-yellow-500" />
          </div>
          
          {isLoading ? (
            <div className="text-gray-500 text-center py-4">Loading plans...</div>
          ) : activePlans.length > 0 ? (
            <div className="space-y-3">
              {activePlans.map((plan) => (
                <div key={plan._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getPlanIcon(plan.type)}</div>
                    <div>
                      <p className="font-medium text-gray-900">{plan.name}</p>
                      <p className="text-sm text-gray-600">${plan.price} / {plan.duration} days</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">Active</p>
                    <p className="text-xs text-gray-500">Expires: {formatPlanExpiry(plan)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Crown className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No active plans</p>
              <button
                onClick={() => navigate('/plans')}
                className="mt-2 text-blue-500 hover:text-blue-600 font-medium"
              >
                Browse Plans
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => navigate('/wallet')}
            className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
          >
            <div className="flex flex-col items-center">
              <div className="p-3 bg-green-100 rounded-lg mb-2">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <span className="font-medium text-gray-900">Wallet</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/plans')}
            className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
          >
            <div className="flex flex-col items-center">
              <div className="p-3 bg-yellow-100 rounded-lg mb-2">
                <Crown className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="font-medium text-gray-900">Plans</span>
            </div>
          </button>
        </div>

        {/* Admin Access */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1">Admin Dashboard</h3>
                <p className="text-purple-100 text-sm">Manage users, plans, and analytics</p>
              </div>
              <Settings className="w-8 h-8 text-purple-200" />
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="mt-4 w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Open Admin Panel
            </button>
          </div>
        )}

        {/* Account Settings */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Account Settings</h2>
          
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900">Edit Profile</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>

            <button 
              onClick={() => navigate('/wallet')}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900">Payment History</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>

            <button 
              onClick={() => navigate('/plans')}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900">Subscription Management</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
