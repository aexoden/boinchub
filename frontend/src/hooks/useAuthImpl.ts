import { useCallback } from "react";

import { UseAuthReturn } from "../contexts/AuthContext";
import { UserCredentials, UserRegister } from "../types";
import { getAuthErrorMessage } from "../util/error";
import { isAdmin as checkIsAdmin, isSuperAdmin as checkIsSuperAdmin } from "../util/user";

import {
    useCurrentUserQuery,
    useLoginMutation,
    useLogoutMutation,
    useRegisterMutation,
} from "./queries/useAuthQueries";

export const useAuthImpl = (): UseAuthReturn => {
    // Use query hooks to manage authentication state
    const currentUserQuery = useCurrentUserQuery();
    const loginMutation = useLoginMutation();
    const registerMutation = useRegisterMutation();
    const logoutMutation = useLogoutMutation();

    // Determine if the user is authenticated
    const isAuthenticated = !!currentUserQuery.data && !currentUserQuery.isError;

    // Determine loading state
    const loading =
        currentUserQuery.isLoading || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending;

    // Get error state
    const error =
        getAuthErrorMessage(loginMutation.error) ||
        getAuthErrorMessage(registerMutation.error) ||
        getAuthErrorMessage(logoutMutation.error) ||
        null;

    const login = useCallback(
        async (credentials: UserCredentials): Promise<void> => {
            await loginMutation.mutateAsync(credentials);
        },
        [loginMutation],
    );

    const register = useCallback(
        async (userData: UserRegister): Promise<void> => {
            await registerMutation.mutateAsync(userData);
        },
        [registerMutation],
    );

    const logout = useCallback(async (): Promise<void> => {
        await logoutMutation.mutateAsync();
    }, [logoutMutation]);

    const isAdmin = useCallback((): boolean => {
        return currentUserQuery.data ? checkIsAdmin(currentUserQuery.data) : false;
    }, [currentUserQuery.data]);

    const isSuperAdmin = useCallback((): boolean => {
        return currentUserQuery.data ? checkIsSuperAdmin(currentUserQuery.data) : false;
    }, [currentUserQuery.data]);

    return {
        isAuthenticated,
        loading,
        user: currentUserQuery.data ?? null,
        error,
        login,
        register,
        logout,
        isAdmin,
        isSuperAdmin,
    };
};
