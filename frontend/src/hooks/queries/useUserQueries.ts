import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "../../services/user-service";
import { computerService } from "../../services/computer-service";
import { UserUpdate } from "../../types";
import { queryKeys } from "./queryKeys";

export function useUsersQuery(offset = 0, limit = 100) {
    return useQuery({
        queryKey: queryKeys.users.list({ offset, limit }),
        queryFn: () => userService.getAllUsers(),
    });
}

export function useUserQuery(userId: string) {
    return useQuery({
        queryKey: queryKeys.users.detail(userId),
        queryFn: () => userService.getUserById(userId),
    });
}

export function useCurrentUserComputersQuery() {
    return useQuery({
        queryKey: queryKeys.users.currentUserComputers(),
        queryFn: computerService.getUserComputers,
    });
}

export function useUpdateCurrentUserMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userData: UserUpdate) => userService.updateCurrentUser(userData),
        onSuccess: async (updatedUser) => {
            queryClient.setQueryData(queryKeys.auth.currentUser(), updatedUser);
            await queryClient.invalidateQueries({ queryKey: queryKeys.users.currentUser() });
        },
    });
}

export function useUpdateUserMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, userData }: { userId: string; userData: UserUpdate }) =>
            userService.updateUser(userId, userData),
        onSuccess: async (updatedUser) => {
            queryClient.setQueryData(queryKeys.users.detail(updatedUser.id), updatedUser);
            await queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });

            const currentUser = queryClient.getQueryData(queryKeys.auth.currentUser());

            if (currentUser) {
                const currentUserId = typeof currentUser === "object" && "id" in currentUser ? currentUser.id : null;

                if (currentUserId === updatedUser.id) {
                    queryClient.setQueryData(queryKeys.auth.currentUser(), updatedUser);
                }
            }
        },
    });
}

export function useDeleteUserMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: userService.deleteUser,
        onSuccess: async (_, deletedUserId) => {
            queryClient.removeQueries({ queryKey: queryKeys.users.detail(deletedUserId) });
            await queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
        },
    });
}
