import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sessionService } from "../../services/session-service";

const SESSIONS_QUERY_KEY = ["sessions"] as const;

export function useUserSessionsQuery() {
    return useQuery({
        queryKey: SESSIONS_QUERY_KEY,
        queryFn: sessionService.getUserSessions,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
    });
}

export function useRevokeSessionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: sessionService.revokeSession,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
        },
    });
}

export function useLogoutAllOtherSessionsMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: sessionService.logoutAllOtherSessions,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
        },
    });
}
