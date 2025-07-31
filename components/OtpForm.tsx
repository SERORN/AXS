
import React, { useState, useRef, useEffect } from 'react';
import { View } from '../types';
import { Spinner } from './Spinner';

interface OtpFormProps {
    phone: string;
    onSubmit: (otp: string) => Promise<void>;
    onBack: () => void;
    isLoading: boolean;
    error: string | null;
}

export const OtpForm: React.FC<OtpFormProps> = ({ phone, onSubmit, onBack, isLoading, error }) => {
    const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        if (element.value !== '' && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
        
        if (newOtp.every(digit => digit !== '')) {
            onSubmit(newOtp.join(''));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 animate-fade-in">
            <div className="w-full max-w-sm mx-auto text-center">
                <h1 className="text-3xl font-bold text-on-surface">Verify Code</h1>
                <p className="text-on-surface-secondary mt-2">
                    Enter the code sent to <span className="font-semibold text-on-surface">{phone}</span>
                </p>

                <div className="flex justify-center gap-2 md:gap-4 mt-12">
                    {otp.map((data, index) => (
                        <input
                            key={index}
                            type="text"
                            name="otp"
                            maxLength={1}
                            value={data}
                            onChange={e => handleChange(e.target, index)}
                            onKeyDown={e => handleKeyDown(e, index)}
                            ref={el => { inputsRef.current[index] = el; }}
                            className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-semibold bg-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                            disabled={isLoading}
                        />
                    ))}
                </div>

                {isLoading && (
                    <div className="mt-8 flex justify-center">
                        <Spinner />
                    </div>
                )}
                
                {error && (
                     <p className="mt-6 text-danger font-semibold">{error}</p>
                )}

                <p className="mt-8 text-on-surface-secondary">
                    Didn't get a code?{' '}
                    <button onClick={onBack} className="font-semibold text-primary hover:underline">
                        Resend
                    </button>
                </p>
            </div>
        </div>
    );
};
