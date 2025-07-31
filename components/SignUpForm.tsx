
import React, { useState } from 'react';
import { Spinner } from './Spinner';

interface SignUpFormProps {
    phone: string;
    onSubmit: (details: { name: string; email: string }) => Promise<void>;
    isLoading: boolean;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ phone, onSubmit, isLoading }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const canSubmit = name.trim() !== '' && email.includes('@');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (canSubmit && !isLoading) {
            onSubmit({ name, email });
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 animate-fade-in">
            <div className="w-full max-w-sm mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-on-surface">Create Your Account</h1>
                    <p className="text-on-surface-secondary mt-2">Just a few more details to get you started.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-on-surface-secondary mb-2">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Jane Doe"
                            className="w-full bg-surface p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-on-surface-secondary mb-2">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-surface p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!canSubmit || isLoading}
                        className="w-full mt-8 py-4 px-6 rounded-lg font-bold text-lg transition-all duration-300 bg-primary text-background flex justify-center items-center disabled:bg-surface disabled:text-on-surface-secondary disabled:cursor-not-allowed hover:enabled:scale-105"
                    >
                        {isLoading ? <Spinner size="sm" /> : 'Complete Registration'}
                    </button>
                </form>
            </div>
        </div>
    );
};
