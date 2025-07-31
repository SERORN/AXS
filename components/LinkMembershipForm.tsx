
import React, { useState } from 'react';
import { View } from '../types';
import { ArrowLeftIcon } from './Icons';
import { Spinner } from './Spinner';

interface LinkMembershipFormProps {
    setView: (view: View) => void;
    onLinkMembership: () => Promise<void>;
}

export const LinkMembershipForm: React.FC<LinkMembershipFormProps> = ({ setView, onLinkMembership }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;
        if (name === 'number') {
            formattedValue = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
        } else if (name === 'expiry') {
            formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d{0,2})/, '$1/$2');
        } else if (name === 'cvv') {
            formattedValue = value.replace(/\D/g, '');
        }
        setCard(prev => ({ ...prev, [name]: formattedValue }));
    };

    const canSubmit = card.number.length >= 19 && card.name && card.expiry.length === 5 && card.cvv.length >= 3;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit || isLoading) return;
        setIsLoading(true);
        await onLinkMembership();
        // App component will handle view change
    };

    return (
        <div className="min-h-screen flex flex-col bg-background p-6 animate-fade-in">
            <header className="flex items-center">
                <button onClick={() => setView(View.AddLoungeOptions)} className="p-2 -ml-2">
                    <ArrowLeftIcon className="w-6 h-6 text-on-surface-secondary" />
                </button>
                <h1 className="text-xl font-bold ml-4">Link Membership</h1>
            </header>
            <main className="flex-grow mt-8">
                <p className="text-center text-on-surface-secondary mb-8">Enter your card details to verify your lounge access benefits.</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <InputField label="Card Number" name="number" value={card.number} onChange={handleInputChange} placeholder="0000 0000 0000 0000" maxLength={19} />
                    <InputField label="Name on Card" name="name" value={card.name} onChange={handleInputChange} placeholder="e.g., James Bond" />
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <InputField label="Expiry Date" name="expiry" value={card.expiry} onChange={handleInputChange} placeholder="MM/YY" maxLength={5} />
                        </div>
                        <div className="w-1/2">
                            <InputField label="CVV" name="cvv" value={card.cvv} onChange={handleInputChange} placeholder="123" type="password" maxLength={4} />
                        </div>
                    </div>
                    <div className="pt-4">
                        <button type="submit" disabled={!canSubmit || isLoading} className="w-full flex justify-center items-center py-4 px-6 rounded-lg font-bold text-lg transition-all duration-300 bg-primary text-background disabled:bg-surface disabled:text-on-surface-secondary disabled:cursor-not-allowed hover:enabled:scale-105">
                            {isLoading ? <Spinner size="sm" /> : 'Link Card'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

const InputField: React.FC<{label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string, type?: string, maxLength?: number}> = 
({ label, name, value, onChange, placeholder, type = 'text', maxLength }) => (
    <div>
        <label className="block text-sm font-medium text-on-surface-secondary mb-2">{label}</label>
        <input
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            className="w-full bg-surface p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
            required
        />
    </div>
);
