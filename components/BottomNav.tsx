
import React from 'react';
import { View } from '../types';
import { QrCodeIcon, UserCircleIcon } from './Icons';

interface BottomNavProps {
    activeView: 'Home' | 'Profile';
    setView: (view: View) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeView, setView }) => {
    const navItems = [
        { name: 'Access', view: View.Home, icon: QrCodeIcon },
        { name: 'Profile', view: View.Profile, icon: UserCircleIcon },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-700/50">
            <div className="flex justify-around max-w-md mx-auto">
                {navItems.map(item => {
                    const isActive = (item.name === 'Access' && activeView === 'Home') || item.name === activeView;
                    return (
                        <button
                            key={item.name}
                            onClick={() => setView(item.view)}
                            className={`flex flex-col items-center justify-center w-full py-3 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-on-surface-secondary hover:text-on-surface'}`}
                        >
                            <item.icon className="w-7 h-7" />
                            <span className="text-xs mt-1 font-medium">{item.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
