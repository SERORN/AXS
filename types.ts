
export enum View {
    Auth,
    PhoneInput,
    Otp,
    SignUp,
    Home,
    NoPasses,
    Profile,
    AddPassType,
    AddVehicle,
    AddLoungeOptions,
    LinkLoungeMembership,
    PurchaseLoungePass,
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'user' | 'admin';
    balance: number;
    activePlans: Plan[];
}

export interface Plan {
    _id: string;
    name: string;
    type: 'basic' | 'premium' | 'lounge' | 'parking';
    price: number;
    currency: string;
    duration: number; // days
    benefits: string[];
    isActive: boolean;
    stripePriceId?: string;
}

export interface Transaction {
    _id: string;
    userId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'succeeded' | 'failed' | 'canceled';
    type: 'wallet_topup' | 'pass_purchase' | 'plan_subscription';
    paymentIntentId?: string;
    planId?: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

export interface WalletBalance {
    balance: number;
    currency: string;
    formattedBalance: string;
}

export interface AdminStats {
    users: {
        total: number;
        active: number;
        new: number;
    };
    revenue: {
        total: number;
        monthly: number;
        currency: string;
    };
    passes: {
        active: number;
        expired: number;
        total: number;
    };
    plans: {
        activeSubscriptions: number;
        totalRevenue: number;
    };
}

export enum PassType {
    Vehicle = 'VEHICLE',
    Lounge = 'LOUNGE',
}

export interface BasePass {
    id: string;
    type: PassType;
}

export interface VehiclePass extends BasePass {
    type: PassType.Vehicle;
    make: string;
    model: string;
    year: number;
    plate: string;
    vin: string;
}

export interface LoungePass extends BasePass {
    type: PassType.Lounge;
    loungeName: string;
    location: string;
    expires: string; // e.g., "12/28" or "One-Time Use"
}

export type Pass = VehiclePass | LoungePass;

export interface AccessLog {
    id: string;
    pass: Pass;
    action: 'Entry' | 'Exit';
    location: string;
    timestamp: string; // ISO 8601 date string
}

export interface LoungeDetails {
    id: string;
    name: string;
    location: string;
    price: number;
}
