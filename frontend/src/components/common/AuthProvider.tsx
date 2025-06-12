import { useNavigate } from "react-router";
import { UserCredentials, UserRegister } from "../../types";
import { AuthContext } from "../../contexts/AuthContext";
import { useCurrentUserQuery, useLoginMutation, useRegisterMutation, useLogoutMutation } from "../../hooks/queries";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();

    // Query for current user
    const { data: user, isLoading: userLoading, error: userError } = useCurrentUserQuery();

    // Mutations
    const loginMutation = useLoginMutation();
    const registerMutation = useRegisterMutation();
    const logoutMutation = useLogoutMutation();

    // Determine overall loading state
    const loading = userLoading || loginMutation.isPending || registerMutation.isPending;

    // Determine error state
    const error = loginMutation.error?.message ?? registerMutation.error?.message ?? userError?.message ?? null;

    // Login function
    async function login(credentials: UserCredentials) {
        await loginMutation.mutateAsync(credentials);
        await navigate("/dashboard");
    }

    // Register function
    async function register(userData: UserRegister) {
        await registerMutation.mutateAsync(userData);
        await navigate("/dashboard");
    }

    // Logout function
    async function logout() {
        logoutMutation.mutate();
        await navigate("/login");
    }

    // Check if user is admin
    const isAdmin = () => {
        return user?.role === "admin";
    };

    // Context value
    const value = {
        user: user ?? null,
        loading,
        error,
        login,
        register,
        logout,
        isAdmin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
