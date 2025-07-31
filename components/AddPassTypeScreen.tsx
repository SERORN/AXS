
import React from 'react';
import { View } from '../types';
import { ArrowLeftIcon, CarIcon, PlaneIcon } from './Icons';

interface AddPassTypeScreenProps {
    setView: (view: View) => void;
    previousView: View;
}

const ChoiceButton: React.FC<{icon: React.ReactNode; label: string; onClick: () => void;}> = ({ icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className="bg-surface rounded-lg p-8 w-full flex flex-col items-center justify-center text-center hover:bg-gray-700/50 transition-all duration-200 hover:scale-105"
    >
        <div className="text-primary">{icon}</div>
        <span className="mt-4 text-xl font-bold text-on-surface">{label}</span>
    </button>
)

export const AddPassTypeScreen: React.FC<AddPassTypeScreenProps> = ({ setView, previousView }) => {
    return (
        <div className="min-h-screen flex flex-col bg-background p-6 animate-fade-in">
             <header className="flex items-center">
                <button onClick={() => setView(previousView)} className="p-2 -ml-2">
                    <ArrowLeftIcon className="w-6 h-6 text-on-surface-secondary" />
                </button>
            </header>
            <main className="flex-grow flex flex-col justify-center items-center">
                <div className="w-full max-w-sm mx-auto text-center">
                    <h1 className="text-3xl font-bold text-on-surface">Add a New Pass</h1>
                    <p className="text-on-surface-secondary mt-2 mb-12">What kind of access would you like to add?</p>

                    <div className="space-y-6 w-full">
                        <ChoiceButton 
                            icon={<CarIcon className="w-12 h-12"/>}
                            label="Vehicle Access"
                            onClick={() => setView(View.AddVehicle)}
                        />
                         <ChoiceButton 
                            icon={<PlaneIcon className="w-12 h-12"/>}
                            label="Airport Lounge"
                            onClick={() => setView(View.AddLoungeOptions)}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};
