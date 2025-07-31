import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Users, 
  DollarSign, 
  CreditCard, 
  Crown, 
  BarChart3,
  Settings,
  UserCheck,
  UserX,
  Plus,
  Edit3,
  Trash2,
  Loader2
} from 'lucide-react';
import { AdminStats, User, Plan } from '../types';
import { 
  getAdminStats, 
  getAdminUsers, 
  updateUserRole, 
  getPlans,
  createPlan,
  updatePlan,
  deletePlan
} from '../services/api';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, change }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <p className="text-green-600 text-sm mt-1">{change}</p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

interface UserRowProps {
  user: User;
  onRoleUpdate: (userId: string, role: 'user' | 'admin') => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, onRoleUpdate }) => (
  <tr className="border-b border-gray-200 hover:bg-gray-50">
    <td className="py-4 px-6">
      <div>
        <p className="font-medium text-gray-900">{user.name}</p>
        <p className="text-gray-500 text-sm">{user.email}</p>
      </div>
    </td>
    <td className="py-4 px-6 text-gray-900">{user.phone}</td>
    <td className="py-4 px-6">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        user.role === 'admin' 
          ? 'bg-purple-100 text-purple-800' 
          : 'bg-green-100 text-green-800'
      }`}>
        {user.role}
      </span>
    </td>
    <td className="py-4 px-6 text-gray-900">${user.balance?.toFixed(2) || '0.00'}</td>
    <td className="py-4 px-6 text-gray-900">{user.activePlans?.length || 0}</td>
    <td className="py-4 px-6">
      <div className="flex space-x-2">
        <button
          onClick={() => onRoleUpdate(user.id, user.role === 'admin' ? 'user' : 'admin')}
          className={`p-2 rounded-lg transition-colors ${
            user.role === 'admin'
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          }`}
          title={user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
        >
          {user.role === 'admin' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
        </button>
      </div>
    </td>
  </tr>
);

interface PlanRowProps {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onDelete: (planId: string) => void;
}

const PlanRow: React.FC<PlanRowProps> = ({ plan, onEdit, onDelete }) => (
  <tr className="border-b border-gray-200 hover:bg-gray-50">
    <td className="py-4 px-6">
      <div>
        <p className="font-medium text-gray-900">{plan.name}</p>
        <p className="text-gray-500 text-sm">{plan.type}</p>
      </div>
    </td>
    <td className="py-4 px-6 text-gray-900">${plan.price}</td>
    <td className="py-4 px-6 text-gray-900">{plan.duration} days</td>
    <td className="py-4 px-6">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        plan.isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {plan.isActive ? 'Active' : 'Inactive'}
      </span>
    </td>
    <td className="py-4 px-6">
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(plan)}
          className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
          title="Edit Plan"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(plan._id)}
          className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
          title="Delete Plan"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
);

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'plans'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  
  // Plan form state
  const [planForm, setPlanForm] = useState({
    name: '',
    type: 'basic' as 'basic' | 'premium' | 'lounge' | 'parking',
    price: 0,
    currency: 'USD',
    duration: 30,
    benefits: [''],
    isActive: true
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, usersData, plansData] = await Promise.all([
        getAdminStats(),
        getAdminUsers(1, 50),
        getPlans()
      ]);
      
      setStats(statsData);
      setUsers(usersData.users);
      setPlans(plansData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await updateUserRole(userId, newRole);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const planData = {
        ...planForm,
        benefits: planForm.benefits.filter(benefit => benefit.trim() !== '')
      };

      if (editingPlan) {
        const response = await updatePlan(editingPlan._id, planData);
        setPlans(prev => prev.map(plan => 
          plan._id === editingPlan._id ? response.data!.plan : plan
        ));
        toast.success('Plan updated successfully');
      } else {
        const response = await createPlan(planData);
        setPlans(prev => [...prev, response.data!.plan]);
        toast.success('Plan created successfully');
      }
      
      setShowPlanModal(false);
      setEditingPlan(null);
      resetPlanForm();
    } catch (error) {
      toast.error(editingPlan ? 'Failed to update plan' : 'Failed to create plan');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      await deletePlan(planId);
      setPlans(prev => prev.filter(plan => plan._id !== planId));
      toast.success('Plan deleted successfully');
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };

  const resetPlanForm = () => {
    setPlanForm({
      name: '',
      type: 'basic',
      price: 0,
      currency: 'USD',
      duration: 30,
      benefits: [''],
      isActive: true
    });
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      type: plan.type,
      price: plan.price,
      currency: plan.currency,
      duration: plan.duration,
      benefits: plan.benefits.length > 0 ? plan.benefits : [''],
      isActive: plan.isActive
    });
    setShowPlanModal(true);
  };

  const addBenefitField = () => {
    setPlanForm(prev => ({
      ...prev,
      benefits: [...prev.benefits, '']
    }));
  };

  const updateBenefit = (index: number, value: string) => {
    setPlanForm(prev => ({
      ...prev,
      benefits: prev.benefits.map((benefit, i) => i === index ? value : benefit)
    }));
  };

  const removeBenefit = (index: number) => {
    setPlanForm(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-4 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'plans', label: 'Plans', icon: Crown },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={stats.users.total}
                icon={<Users className="w-6 h-6 text-white" />}
                color="bg-blue-500"
                change={`+${stats.users.new} new`}
              />
              <StatCard
                title="Total Revenue"
                value={`$${stats.revenue.total.toFixed(2)}`}
                icon={<DollarSign className="w-6 h-6 text-white" />}
                color="bg-green-500"
                change={`$${stats.revenue.monthly.toFixed(2)} this month`}
              />
              <StatCard
                title="Active Passes"
                value={stats.passes.active}
                icon={<CreditCard className="w-6 h-6 text-white" />}
                color="bg-purple-500"
                change={`${stats.passes.total} total`}
              />
              <StatCard
                title="Plan Subscriptions"
                value={stats.plans.activeSubscriptions}
                icon={<Crown className="w-6 h-6 text-white" />}
                color="bg-yellow-500"
                change={`$${stats.plans.totalRevenue.toFixed(2)} revenue`}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">User Growth</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active Users</span>
                    <span className="font-semibold">{stats.users.active}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">New Users</span>
                    <span className="font-semibold text-green-600">+{stats.users.new}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Users</span>
                    <span className="font-semibold">{stats.users.total}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Monthly Revenue</span>
                    <span className="font-semibold">${stats.revenue.monthly.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Plan Revenue</span>
                    <span className="font-semibold">${stats.plans.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-semibold text-green-600">${stats.revenue.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">User Management</h2>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">User</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Phone</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Role</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Balance</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Plans</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onRoleUpdate={handleRoleUpdate}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Plan Management</h2>
              <button
                onClick={() => {
                  setEditingPlan(null);
                  resetPlanForm();
                  setShowPlanModal(true);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Plan</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Plan</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Price</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Duration</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <PlanRow
                      key={plan._id}
                      plan={plan}
                      onEdit={handleEditPlan}
                      onDelete={handleDeletePlan}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Plan Modal */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </h3>
              
              <form onSubmit={handlePlanSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Type
                  </label>
                  <select
                    value={planForm.type}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="lounge">Lounge</option>
                    <option value="parking">Parking</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={planForm.price}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={planForm.duration}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Benefits
                  </label>
                  {planForm.benefits.map((benefit, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) => updateBenefit(index, e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter benefit"
                      />
                      {planForm.benefits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBenefit(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addBenefitField}
                    className="text-blue-500 hover:text-blue-600 text-sm flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add benefit</span>
                  </button>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={planForm.isActive}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Plan is active
                  </label>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlanModal(false);
                      setEditingPlan(null);
                      resetPlanForm();
                    }}
                    className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
