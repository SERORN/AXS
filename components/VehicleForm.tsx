
import React, { useState } from 'react';
import { View, VehiclePass } from '../types';
import { ArrowLeftIcon } from './Icons';
import { Spinner } from './Spinner';

interface VehicleFormProps {
    setView: (view: View) => void;
    onAddVehicle: (vehicle: Omit<VehiclePass, 'id' | 'type'>) => Promise<void>;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ setView, onAddVehicle }) => {
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [plate, setPlate] = useState('');
    const [vin, setVin] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const canSubmit = make && model && year.length === 4 && plate && vin;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit || isLoading) return;
        setIsLoading(true);
        await onAddVehicle({
            make,
            model,
            year: parseInt(year, 10),
            plate,
            vin,
        });
        setIsLoading(false);
        // App component will handle view change on success
    };

    return (
        <div className="min-h-screen flex flex-col bg-background p-6 animate-fade-in">
            <header className="flex items-center">
                <button onClick={() => setView(View.AddPassType)} className="p-2 -ml-2">
                    <ArrowLeftIcon className="w-6 h-6 text-on-surface-secondary" />
                </button>
                 <h1 className="text-xl font-bold ml-4">Add Vehicle Details</h1>
            </header>
            <main className="flex-grow mt-8">
                 <form onSubmit={handleSubmit} className="space-y-5">
                    <InputField label="Make" value={make} onChange={e => setMake(e.target.value)} placeholder="e.g., Aston Martin" />
                    <InputField label="Model" value={model} onChange={e => setModel(e.target.value)} placeholder="e.g., Vantage" />
                    <InputField label="Year" type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="e.g., 2024" />
                    <InputField label="License Plate" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} placeholder="e.g., MI6-007" />
                    <InputField label="VIN" value={vin} onChange={e => setVin(e.target.value.toUpperCase())} placeholder="Vehicle Identification Number" />

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={!canSubmit || isLoading}
                            className="w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-300 bg-primary text-background flex justify-center items-center disabled:bg-surface disabled:text-on-surface-secondary disabled:cursor-not-allowed hover:enabled:scale-105"
                        >
                            {isLoading ? <Spinner size="sm" /> : 'Add Vehicle Pass'}
                        </button>
                    </div>
                 </form>
            </main>
        </div>
    );
};

// Reusable Input Field for this form
const InputField: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string, type?: string}> = 
({ label, value, onChange, placeholder, type = 'text' }) => (
    <div>
        <label className="block text-sm font-medium text-on-surface-secondary mb-2">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-surface p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
            required
        />
    </div>
);
