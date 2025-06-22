import { createContext, useContext } from "react";
import { User, UserCredentials, UserRegister } from "../types";

interface AuthState {
    isAuthenticated: boolean;
    loading: boolean;
    user: User | null;
    error: string | null;
}

interface AuthActions {
    login: (credentials: UserCredentials) => Promise<void>;
    register: (userData: UserRegister) => Promise<void>;
    logout: () => Promise<void>;
    isAdmin: () => boolean;
    isSuperAdmin: () => boolean;
}

export interface UseAuthReturn extends AuthState, AuthActions {}

export const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

export function useAuth(): UseAuthReturn {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
}
