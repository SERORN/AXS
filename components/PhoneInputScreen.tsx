
import React, { useState } from 'react';
import { View } from '../types';
import { ArrowLeftIcon } from './Icons';
import { Spinner } from './Spinner';

interface PhoneInputScreenProps {
    setView: (view: View) => void;
    setPhoneForAuth: (phone: string) => void;
    onContinue: (phone: string) => Promise<void>;
    isLoading: boolean;
}

export const PhoneInputScreen: React.FC<PhoneInputScreenProps> = ({ setView, setPhoneForAuth, onContinue, isLoading }) => {
    const [countryCode, setCountryCode] = useState('+1');
    const [phoneNumber, setPhoneNumber] = useState('');

    const isValid = /^\d{10}$/.test(phoneNumber);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '');
        setPhoneNumber(digits);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValid && !isLoading) {
            const fullPhone = countryCode + phoneNumber;
            setPhoneForAuth(fullPhone);
            onContinue(fullPhone);
        }
    };
    
    const countryOptions = [
        { code: '+1', flag: '🇺🇸', name: 'USA' },
        { code: '+52', flag: '🇲🇽', name: 'Mexico' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background p-6 animate-fade-in">
            <header className="flex items-center">
                <button onClick={() => setView(View.Auth)} className="p-2 -ml-2">
                    <ArrowLeftIcon className="w-6 h-6 text-on-surface-secondary" />
                </button>
            </header>
            <main className="flex-grow flex flex-col justify-center">
                <div className="w-full max-w-sm mx-auto text-center">
                    <h1 className="text-3xl font-bold text-on-surface">Enter your phone</h1>
                    <p className="text-on-surface-secondary mt-2">We'll send you a confirmation code.</p>

                    <form onSubmit={handleSubmit} className="mt-12">
                        <div className="flex items-center bg-surface rounded-lg">
                            <div className="relative">
                                <select 
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="bg-transparent pl-4 pr-10 py-4 font-semibold appearance-none focus:outline-none"
                                >
                                    {countryOptions.map(opt => (
                                        <option key={opt.code} value={opt.code} className="bg-surface text-on-surface">
                                            {opt.flag} {opt.code}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={handleInput}
                                placeholder="Phone number"
                                className="flex-1 bg-transparent p-4 w-full focus:outline-none text-lg placeholder-on-surface-secondary"
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!isValid || isLoading}
                            className="w-full mt-8 py-4 px-6 rounded-lg font-bold text-lg transition-all duration-300 bg-primary text-background disabled:bg-surface disabled:text-on-surface-secondary disabled:cursor-not-allowed hover:enabled:scale-105"
                        >
                            {isLoading ? <Spinner size="sm" /> : 'Continue'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};
