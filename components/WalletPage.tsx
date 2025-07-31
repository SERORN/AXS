import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Wallet, Plus, History, CreditCard, Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { WalletBalance, Transaction } from '../types';
import { getWalletBalance, getWalletTransactions, createPaymentIntent } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { StripePaymentWrapper } from './PaymentForm';

interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'failed') return '❌';
    
    switch (type) {
      case 'wallet_topup': return <ArrowUpCircle className="w-5 h-5 text-green-500" />;
      case 'pass_purchase': return <ArrowDownCircle className="w-5 h-5 text-red-500" />;
      case 'plan_subscription': return <CreditCard className="w-5 h-5 text-blue-500" />;
      default: return <Wallet className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      case 'canceled': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const prefix = type === 'wallet_topup' ? '+' : '-';
    return `${prefix}$${(amount / 100).toFixed(2)}`;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'wallet_topup': return 'Wallet Top-up';
      case 'pass_purchase': return 'Pass Purchase';
      case 'plan_subscription': return 'Plan Subscription';
      default: return 'Transaction';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-50 rounded-full">
          {getTransactionIcon(transaction.type, transaction.status)}
        </div>
        <div>
          <p className="font-medium text-gray-900">{getTypeLabel(transaction.type)}</p>
          <p className="text-sm text-gray-500">
            {new Date(transaction.createdAt).toLocaleDateString()} at{' '}
            {new Date(transaction.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${
          transaction.type === 'wallet_topup' ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatAmount(transaction.amount, transaction.type)}
        </p>
        <p className={`text-sm ${getStatusColor(transaction.status)}`}>
          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
        </p>
      </div>
    </div>
  );
};

export const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(25);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const predefinedAmounts = [10, 25, 50, 100];

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const [balanceData, transactionsData] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions(1, 10)
      ]);
      
      setBalance(balanceData);
      setTransactions(transactionsData.transactions);
    } catch (error) {
      toast.error('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreTransactions = async () => {
    if (isLoadingTransactions) return;
    
    setIsLoadingTransactions(true);
    try {
      const page = Math.floor(transactions.length / 10) + 1;
      const transactionsData = await getWalletTransactions(page, 10);
      setTransactions(prev => [...prev, ...transactionsData.transactions]);
    } catch (error) {
      toast.error('Failed to load more transactions');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleTopUpRequest = async () => {
    if (topUpAmount < 5) {
      toast.error('Minimum top-up amount is $5');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const response = await createPaymentIntent(
        topUpAmount * 100, // Convert to cents
        'wallet_topup'
      );

      setClientSecret(response.data!.clientSecret);
    } catch (error) {
      toast.error('Failed to initiate payment');
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      // Refresh wallet balance
      const newBalance = await getWalletBalance();
      setBalance(newBalance);
      
      // Update user context
      updateUser({ balance: newBalance.balance });
      
      // Refresh transactions
      const transactionsData = await getWalletTransactions(1, 10);
      setTransactions(transactionsData.transactions);

      toast.success(`Successfully added $${topUpAmount} to your wallet!`);
      setShowTopUp(false);
      setClientSecret('');
      setTopUpAmount(25);
    } catch (error) {
      toast.error('Payment successful but failed to update balance. Please refresh.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
    setClientSecret('');
    setIsProcessingPayment(false);
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Wallet className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wallet</h1>
          <p className="text-gray-600">Manage your balance and view transaction history</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm mb-1">Available Balance</p>
              <p className="text-4xl font-bold">
                {balance?.formattedBalance || `$${(balance?.balance || 0).toFixed(2)}`}
              </p>
            </div>
            <Wallet className="w-8 h-8 text-blue-200" />
          </div>
          
          <button
            onClick={() => setShowTopUp(true)}
            className="mt-4 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Funds</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setShowTopUp(true)}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5 text-green-500" />
            <span className="font-medium text-gray-900">Top Up</span>
          </button>
          
          <button
            onClick={() => navigate('/passes')}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow flex items-center justify-center space-x-2"
          >
            <CreditCard className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-900">Buy Pass</span>
          </button>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-gray-500" />
              <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
            </div>
          </div>

          <div className="space-y-3">
            {transactions.length > 0 ? (
              <>
                {transactions.map((transaction) => (
                  <TransactionItem key={transaction._id} transaction={transaction} />
                ))}
                
                <button
                  onClick={loadMoreTransactions}
                  disabled={isLoadingTransactions}
                  className="w-full py-2 text-blue-500 hover:text-blue-600 font-medium disabled:opacity-50"
                >
                  {isLoadingTransactions ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : (
                    'Load More'
                  )}
                </button>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm">Your transaction history will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Up Modal */}
        {showTopUp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add Funds to Wallet</h3>
              
              {!clientSecret ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Amount
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {predefinedAmounts.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setTopUpAmount(amount)}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            topUpAmount === amount
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Amount
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="1000"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(Number(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleTopUpRequest}
                      disabled={isProcessingPayment || topUpAmount < 5}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                    >
                      {isProcessingPayment ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Processing...
                        </div>
                      ) : (
                        `Add $${topUpAmount}`
                      )}
                    </button>
                    
                    <button
                      onClick={() => setShowTopUp(false)}
                      className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <StripePaymentWrapper
                  amount={topUpAmount * 100}
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  buttonText={`Add $${topUpAmount} to Wallet`}
                  disabled={isProcessingPayment}
                />
              )}
            </div>
          </div>
        )}

        <div className="text-center mt-6">
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
