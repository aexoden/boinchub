import { ReactNode } from "react";

import { AuthContext } from "../../contexts/AuthContext";
import { useAuthImpl } from "../../hooks/useAuthImpl";

interface AuthProviderProps {
    children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
    const auth = useAuthImpl();
    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
