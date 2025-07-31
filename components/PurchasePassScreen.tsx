
import React, { useState, useEffect } from 'react';
import { View, LoungeDetails } from '../types';
import { getAvailableLounges } from '../services/api';
import { ArrowLeftIcon } from './Icons';
import { Spinner } from './Spinner';

interface PurchasePassScreenProps {
    setView: (view: View) => void;
    onPurchase: (lounge: LoungeDetails) => Promise<void>;
}

const PaymentForm: React.FC<{
    lounge: LoungeDetails;
    onCancel: () => void;
    onPay: () => Promise<void>;
    isLoading: boolean;
}> = ({ lounge, onCancel, onPay, isLoading }) => {
     const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
     const canSubmit = card.number.length >= 19 && card.name && card.expiry.length === 5 && card.cvv.length >= 3;

     const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;
        if (name === 'number') formattedValue = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
        else if (name === 'expiry') formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d{0,2})/, '$1/$2');
        else if (name === 'cvv') formattedValue = value.replace(/\D/g, '');
        setCard(prev => ({ ...prev, [name]: formattedValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(canSubmit && !isLoading) onPay();
    }

    return (
        <div className="animate-fade-in">
             <div className="bg-surface p-6 rounded-lg text-center mb-8">
                <h2 className="text-xl font-bold text-on-surface">{lounge.name}</h2>
                <p className="text-on-surface-secondary">{lounge.location}</p>
                <p className="mt-2 text-3xl font-bold text-primary">${lounge.price.toFixed(2)}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <InputField label="Card Number" name="number" value={card.number} onChange={handleInputChange} placeholder="0000 0000 0000 0000" maxLength={19} />
                 <InputField label="Name on Card" name="name" value={card.name} onChange={handleInputChange} placeholder="e.g., James Bond" />
                 <div className="flex gap-4">
                    <div className="w-1/2"><InputField label="Expiry Date" name="expiry" value={card.expiry} onChange={handleInputChange} placeholder="MM/YY" maxLength={5} /></div>
                    <div className="w-1/2"><InputField label="CVV" name="cvv" value={card.cvv} onChange={handleInputChange} placeholder="123" type="password" maxLength={4} /></div>
                 </div>
                 <div className="pt-4 space-y-3">
                    <button type="submit" disabled={!canSubmit || isLoading} className="w-full flex justify-center items-center py-4 rounded-lg font-bold text-lg bg-primary text-background disabled:bg-surface disabled:text-on-surface-secondary">
                        {isLoading ? <Spinner size="sm" /> : `Pay $${lounge.price.toFixed(2)}`}
                    </button>
                    <button type="button" onClick={onCancel} className="w-full py-3 rounded-lg font-semibold text-on-surface-secondary hover:bg-surface">Cancel</button>
                 </div>
            </form>
        </div>
    );
};

export const PurchasePassScreen: React.FC<PurchasePassScreenProps> = ({ setView, onPurchase }) => {
    const [lounges, setLounges] = useState<LoungeDetails[]>([]);
    const [selectedLounge, setSelectedLounge] = useState<LoungeDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);

    useEffect(() => {
        const fetchLounges = async () => {
            setIsLoading(true);
            const data = await getAvailableLounges();
            setLounges(data);
            setIsLoading(false);
        };
        fetchLounges();
    }, []);

    const handlePurchase = async () => {
        if (!selectedLounge) return;
        setIsPaying(true);
        await onPurchase(selectedLounge);
        setIsPaying(false);
        // App will redirect on success
    };

    return (
        <div className="min-h-screen flex flex-col bg-background p-6">
            <header className="flex items-center mb-8">
                <button onClick={() => selectedLounge ? setSelectedLounge(null) : setView(View.AddLoungeOptions)} className="p-2 -ml-2">
                    <ArrowLeftIcon className="w-6 h-6 text-on-surface-secondary" />
                </button>
                <h1 className="text-xl font-bold ml-4">
                    {selectedLounge ? 'Complete Purchase' : 'Purchase Day Pass'}
                </h1>
            </header>
            <main className="flex-grow">
                {isLoading ? <div className="flex justify-center mt-20"><Spinner /></div> : (
                    !selectedLounge ? (
                        <div className="space-y-4 animate-fade-in">
                            {lounges.map(lounge => (
                                <button key={lounge.id} onClick={() => setSelectedLounge(lounge)} className="w-full bg-surface p-4 rounded-lg flex justify-between items-center text-left hover:bg-gray-700/50 transition-colors">
                                    <div>
                                        <p className="font-bold text-on-surface">{lounge.name}</p>
                                        <p className="text-sm text-on-surface-secondary">{lounge.location}</p>
                                    </div>
                                    <p className="font-bold text-primary text-lg">${lounge.price.toFixed(2)}</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <PaymentForm lounge={selectedLounge} onCancel={() => setSelectedLounge(null)} onPay={handlePurchase} isLoading={isPaying} />
                    )
                )}
            </main>
        </div>
    );
};

const InputField: React.FC<{label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string, type?: string, maxLength?: number}> = 
({ label, name, value, onChange, placeholder, type = 'text', maxLength }) => (
    <div>
        <label className="block text-sm font-medium text-on-surface-secondary mb-2">{label}</label>
        <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} className="w-full bg-surface p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" required />
    </div>
);
