import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userProjectKeyService } from "../../services/user-project-key-service";
import { UserProjectKeyRequest } from "../../types";
import { queryKeys } from "./queryKeys";

export function useCurrentUserProjectKeysQuery() {
    return useQuery({
        queryKey: queryKeys.userProjectKeys.currentUser(),
        queryFn: userProjectKeyService.getCurrentUserProjectKeys,
    });
}

export function useCreateOrUpdateProjectKeyMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (keyData: UserProjectKeyRequest) => userProjectKeyService.createOrUpdateProjectKey(keyData),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.userProjectKeys.currentUser() });
        },
    });
}

export function useDeleteProjectKeyMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: userProjectKeyService.deleteProjectKey,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.userProjectKeys.currentUser() });
        },
    });
}

export function useAllUserProjectKeysQuery() {
    return useQuery({
        queryKey: queryKeys.userProjectKeys.all(),
        queryFn: userProjectKeyService.getAllUserProjectKeys,
    });
}
