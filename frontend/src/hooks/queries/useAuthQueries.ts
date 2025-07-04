import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router";

import { authService } from "../../services/api-client";
import { userService } from "../../services/user-service";
import { UserCredentials, UserRegister } from "../../types";

import { queryKeys } from "./queryKeys";

export function useCurrentUserQuery() {
    const location = useLocation();

    // Don't fetch current user on auth pages to avoid unnecessary requests
    const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

    return useQuery({
        queryKey: queryKeys.auth.currentUser(),
        queryFn: userService.getCurrentUser,
        enabled: !isAuthPage,
        retry: (failureCount, error) => {
            if (error instanceof Error && "status" in error) {
                const status = error.status;

                if (status === 401 || status === 403) {
                    return false;
                }
            }

            return failureCount < 2;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        networkMode: "always",
        meta: {
            errorMessage: false,
        },
    });
}

export function useLoginMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (credentials: UserCredentials) => {
            await authService.login(credentials.username, credentials.password);
            return userService.getCurrentUser();
        },
        onSuccess: async (user) => {
            queryClient.setQueryData(queryKeys.auth.currentUser(), user);
            await queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
        },
        onError: () => {
            queryClient.removeQueries({ queryKey: queryKeys.auth.currentUser() });
        },
    });
}

export function useRegisterMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userData: UserRegister) => {
            await userService.register(userData);
            await authService.login(userData.username, userData.password);
            return userService.getCurrentUser();
        },
        onSuccess: async (user) => {
            queryClient.setQueryData(queryKeys.auth.currentUser(), user);
            await queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
        },
        onError: () => {
            queryClient.removeQueries({ queryKey: queryKeys.auth.currentUser() });
        },
    });
}

export function useLogoutMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            await authService.logout();
        },
        onSuccess: () => {
            queryClient.clear();
        },
    });
}
