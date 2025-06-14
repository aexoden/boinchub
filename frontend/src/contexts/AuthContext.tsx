import { createContext, useContext } from "react";
import { User, UserCredentials, UserRegister } from "../types";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (credentials: UserCredentials) => Promise<void>;
    register: (userData: UserRegister) => Promise<void>;
    logout: () => void;
    isAdmin: () => boolean;
    isSuperAdmin: () => boolean;
    canManageUsers: () => boolean;
    canChangeRoles: () => boolean;
}

// Create the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    return context;
}
