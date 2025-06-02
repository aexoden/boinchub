import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ApiError, User, UserCredentials, UserRegister } from "../../types";
import { authService } from "../../services/api-client";
import userService from "../../services/user-service";
import { AuthContext } from "../../contexts/AuthContext";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Load user data on initial render if token exists
    useEffect(() => {
        const loadUser = async () => {
            if (authService.isAuthenticated()) {
                try {
                    const userData = await userService.getCurrentUser();
                    setUser(userData);
                } catch (err) {
                    console.error("Failed to load user data", err);
                    authService.logout();
                }
            }

            setLoading(false);
        };

        void loadUser();
    }, []);

    // Login function
    async function login(credentials: UserCredentials) {
        setLoading(true);
        setError(null);

        try {
            await authService.login(credentials.username, credentials.password);
            const userData = await userService.getCurrentUser();
            setUser(userData);
            void navigate("/dashboard");
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.detail ?? "Failed to login. Please check your credentials.");
            } else {
                setError("Failed to login. Please check your credentials.");
            }
            throw err;
        } finally {
            setLoading(false);
        }
    }

    // Register function
    async function register(userData: UserRegister) {
        setLoading(true);
        setError(null);

        try {
            await userService.register(userData);
            await login({
                username: userData.username,
                password: userData.password,
            });
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.detail ?? "Failed to register. Please try again.");
            } else {
                setError("Failed to register. Please try again.");
            }
            throw err;
        } finally {
            setLoading(false);
        }
    }

    // Logout function
    const logout = () => {
        authService.logout();
        setUser(null);
        void navigate("/login");
    };

    // Check if user is admin
    const isAdmin = () => {
        return user?.role === "admin";
    };

    // Context value
    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAdmin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
