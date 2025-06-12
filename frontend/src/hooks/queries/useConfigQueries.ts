import { useQuery } from "@tanstack/react-query";
import { configService } from "../../services/config-service";
import { queryKeys } from "./queryKeys";

export function useConfigQuery() {
    return useQuery({
        queryKey: queryKeys.config.all(),
        queryFn: configService.getConfig,
        staleTime: Infinity, // Config rarely changes, so we can keep it fresh indefinitely
        gcTime: Infinity,
        retry: (failureCount, _error) => {
            return failureCount < 3;
        },
    });
}
