import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Wallet, Crown, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  requireAdmin?: boolean;
}

export const BottomNavRouter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const navItems: NavItem[] = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Wallet', path: '/wallet', icon: Wallet },
    { name: 'Plans', path: '/plans', icon: Crown },
    { name: 'Profile', path: '/profile', icon: User },
    ...(isAdmin ? [{ name: 'Admin', path: '/admin', icon: Settings, requireAdmin: true }] : []),
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full py-3 transition-colors duration-200 ${
                active 
                  ? 'text-blue-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-6 h-6 ${active ? 'text-blue-500' : 'text-gray-600'}`} />
              <span className={`text-xs mt-1 font-medium ${active ? 'text-blue-500' : 'text-gray-600'}`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
