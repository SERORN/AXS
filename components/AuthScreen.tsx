
import React from 'react';
import { View } from '../types';

interface AuthScreenProps {
    setView: (view: View) => void;
}

const AuthHeader: React.FC = () => (
    <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tighter text-on-surface">AXS</h1>
        <p className="text-primary font-medium mt-1">Your Keyless Access</p>
    </div>
);

const AuthButton: React.FC<{ onClick: () => void; children: React.ReactNode, primary?: boolean }> = ({ onClick, children, primary = false }) => (
    <button
        onClick={onClick}
        className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-transform duration-200 hover:scale-105 ${primary ? 'bg-primary text-background' : 'bg-surface text-on-surface'}`}
    >
        {children}
    </button>
);

export const AuthScreen: React.FC<AuthScreenProps> = ({ setView }) => {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-background p-8">
            <div className="w-full max-w-sm flex flex-col items-center">
                <AuthHeader />
                <div className="mt-24 w-full space-y-4">
                    <AuthButton onClick={() => setView(View.PhoneInput)} primary>
                        Sign In
                    </AuthButton>
                    <AuthButton onClick={() => setView(View.PhoneInput)}>
                        Create Account
                    </AuthButton>
                </div>
            </div>
        </div>
    );
};
