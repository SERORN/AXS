
import React from 'react';
import { User, Pass, View, PassType, VehiclePass, LoungePass } from '../types';
import { UserCircleIcon, CarIcon, PlaneIcon, PlusIcon, LogoutIcon } from './Icons';
import { BottomNav } from './BottomNav';

interface ProfileScreenProps {
    user: User;
    passes: Pass[];
    setView: (view: View) => void;
    onLogout: () => void;
}

const PassListItem: React.FC<{pass: Pass}> = ({ pass }) => {
    return (
        <div className="bg-surface p-4 rounded-lg flex items-center gap-4">
             <div className="bg-gray-800 p-2 rounded-full">
                {pass.type === PassType.Vehicle ? <CarIcon className="w-6 h-6 text-primary" /> : <PlaneIcon className="w-6 h-6 text-primary" />}
            </div>
            <div>
                {pass.type === PassType.Vehicle && (
                    <>
                        <p className="font-semibold text-on-surface">{(pass as VehiclePass).make} {(pass as VehiclePass).model}</p>
                        <p className="text-sm text-on-surface-secondary">Plate: {(pass as VehiclePass).plate}</p>
                    </>
                )}
                 {pass.type === PassType.Lounge && (
                    <>
                        <p className="font-semibold text-on-surface">{(pass as LoungePass).loungeName}</p>
                        <p className="text-sm text-on-surface-secondary">Expires: {(pass as LoungePass).expires}</p>
                    </>
                )}
            </div>
        </div>
    );
};


export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, passes, setView, onLogout }) => {
    return (
        <div className="bg-background min-h-screen pb-24 animate-fade-in">
            <main className="p-6">
                <div className="flex flex-col items-center mt-8">
                    <UserCircleIcon className="w-24 h-24 text-primary" />
                    <h1 className="mt-4 text-3xl font-bold text-on-surface">{user.name}</h1>
                    <p className="mt-1 text-on-surface-secondary">{user.email}</p>
                </div>

                <div className="mt-10">
                    <h2 className="text-xl font-bold text-on-surface mb-4">My Passes</h2>
                    <div className="space-y-3">
                        {passes.map(pass => <PassListItem key={pass.id} pass={pass} />)}
                        <button 
                            onClick={() => setView(View.AddPassType)}
                            className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-gray-700/50 transition-colors text-primary font-semibold p-4 rounded-lg"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span>Add New Pass</span>
                        </button>
                    </div>
                </div>

                <div className="mt-12">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-3 bg-danger/10 text-danger font-semibold p-4 rounded-lg hover:bg-danger/20 transition-colors"
                    >
                         <LogoutIcon className="w-6 h-6"/>
                        <span>Log Out</span>
                    </button>
                </div>

            </main>
            <BottomNav activeView="Profile" setView={setView} />
        </div>
    );
};
