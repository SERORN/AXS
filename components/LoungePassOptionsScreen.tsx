
import React from 'react';
import { View } from '../types';
import { ArrowLeftIcon, CreditCardIcon, PlusIcon } from './Icons';

interface LoungePassOptionsScreenProps {
    setView: (view: View) => void;
}

const OptionButton: React.FC<{icon: React.ReactNode; title: string; subtitle: string; onClick: () => void}> = ({ icon, title, subtitle, onClick }) => (
    <button 
        onClick={onClick}
        className="bg-surface rounded-lg p-6 w-full flex items-center gap-6 text-left hover:bg-gray-700/50 transition-all duration-200 hover:scale-105"
    >
        <div className="text-primary">{icon}</div>
        <div>
            <span className="text-lg font-bold text-on-surface">{title}</span>
            <p className="text-sm text-on-surface-secondary">{subtitle}</p>
        </div>
    </button>
);

export const LoungePassOptionsScreen: React.FC<LoungePassOptionsScreenProps> = ({ setView }) => {
    return (
        <div className="min-h-screen flex flex-col bg-background p-6 animate-fade-in">
            <header className="flex items-center">
                <button onClick={() => setView(View.AddPassType)} className="p-2 -ml-2">
                    <ArrowLeftIcon className="w-6 h-6 text-on-surface-secondary" />
                </button>
                <h1 className="text-xl font-bold ml-4">Add Lounge Access</h1>
            </header>
            <main className="flex-grow flex flex-col justify-center items-center">
                <div className="w-full max-w-sm mx-auto">
                    <div className="space-y-6 w-full">
                         <OptionButton 
                            icon={<CreditCardIcon className="w-10 h-10"/>}
                            title="Link Membership"
                            subtitle="Use an existing benefit (e.g., Amex, Priority Pass)"
                            onClick={() => setView(View.LinkLoungeMembership)}
                        />
                         <OptionButton 
                            icon={<PlusIcon className="w-10 h-10"/>}
                            title="Purchase Day Pass"
                            subtitle="Buy one-time access to a lounge"
                            onClick={() => setView(View.PurchaseLoungePass)}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};
