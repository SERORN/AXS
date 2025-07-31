
import React, { useState, useEffect, useRef } from 'react';
import { User, Pass, PassType, AccessLog, View, VehiclePass, LoungePass } from '../types';
import { getAccessHistory } from '../services/api';
import { QrCodeIcon, CarIcon, PlaneIcon, UserCircleIcon } from './Icons';
import { BottomNav } from './BottomNav';
import { Spinner } from './Spinner';

interface HomeScreenProps {
    user: User;
    passes: Pass[];
    setView: (view: View) => void;
}

const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
};

const PassCard: React.FC<{ pass: Pass }> = ({ pass }) => {
    const getPassDetails = () => {
        if (pass.type === PassType.Vehicle) {
            const vehicle = pass as VehiclePass;
            return `${vehicle.make} ${vehicle.model} / ${vehicle.plate}`;
        }
        const lounge = pass as LoungePass;
        return `${lounge.loungeName} / Expires: ${lounge.expires}`;
    };

    return (
        <div className="flex-shrink-0 w-full snap-center text-center">
            <div className="bg-white p-6 rounded-2xl inline-block">
                <QrCodeIcon className="w-48 h-48 text-black" />
            </div>
            <p className="mt-4 font-semibold text-on-surface text-lg">{getPassDetails()}</p>
        </div>
    );
};


export const HomeScreen: React.FC<HomeScreenProps> = ({ user, passes, setView }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [activity, setActivity] = useState<AccessLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchActivity = async () => {
            setIsLoading(true);
            const history = await getAccessHistory(user.id);
            setActivity(history);
            setIsLoading(false);
        };
        fetchActivity();
    }, [user.id]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const scrollLeft = scrollRef.current.scrollLeft;
            const cardWidth = scrollRef.current.clientWidth;
            const newIndex = Math.round(scrollLeft / cardWidth);
            setActiveIndex(newIndex);
        }
    };
    
    return (
        <div className="bg-background min-h-screen pb-24">
            <header className="p-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-on-surface">
                        Welcome back, <span className="text-primary">{user.name.split(' ')[0]}</span>
                    </h1>
                </div>
                <button onClick={() => setView(View.Profile)} className="p-1">
                    <UserCircleIcon className="w-9 h-9 text-on-surface-secondary hover:text-primary transition-colors" />
                </button>
            </header>

            <main className="px-6">
                {/* Pass Carousel */}
                <div className="mt-4">
                    <div 
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar"
                    >
                        {passes.map(pass => (
                            <PassCard key={pass.id} pass={pass} />
                        ))}
                    </div>
                    {passes.length > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4">
                            {passes.map((_, index) => (
                                <div key={index} className={`w-2 h-2 rounded-full transition-all duration-300 ${activeIndex === index ? 'bg-primary scale-125' : 'bg-surface'}`}></div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="mt-10">
                    <h2 className="text-xl font-bold text-on-surface">Recent Activity</h2>
                    {isLoading ? (
                        <div className="flex justify-center mt-8"><Spinner/></div>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {activity.map(log => (
                                <div key={log.id} className="bg-surface p-4 rounded-lg flex items-center gap-4">
                                    <div className="bg-gray-800 p-2 rounded-full">
                                        {log.pass.type === PassType.Vehicle ? <CarIcon className="w-6 h-6 text-primary" /> : <PlaneIcon className="w-6 h-6 text-primary" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-on-surface">{log.action}: {log.location}</p>
                                        <p className="text-sm text-on-surface-secondary">
                                            {(log.pass as VehiclePass).plate || (log.pass as LoungePass).loungeName}
                                        </p>
                                    </div>
                                    <p className="text-sm font-medium text-on-surface-secondary">{timeAgo(log.timestamp)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <BottomNav activeView="Home" setView={setView} />
        </div>
    );
};
