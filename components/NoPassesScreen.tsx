
import React from 'react';
import { User, View } from '../types';
import { BottomNav } from './BottomNav';

interface NoPassesScreenProps {
    user: User;
    setView: (view: View) => void;
}

export const NoPassesScreen: React.FC<NoPassesScreenProps> = ({ user, setView }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center pb-24">
            <h1 className="text-4xl font-bold text-on-surface">Welcome, {user.name.split(' ')[0]}!</h1>
            <p className="mt-4 text-lg text-on-surface-secondary max-w-sm">
                It looks like you don't have any passes yet. Let's get your first one set up.
            </p>
            <button
                onClick={() => setView(View.AddPassType)}
                className="mt-12 py-4 px-8 rounded-lg font-bold text-lg transition-transform duration-200 hover:scale-105 bg-primary text-background"
            >
                Add a Pass
            </button>
            <BottomNav activeView="Home" setView={setView} />
        </div>
    );
};
