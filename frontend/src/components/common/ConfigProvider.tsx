import { ConfigContext } from "../../contexts/ConfigContext";
import { useConfigQuery } from "../../hooks/queries";

export default function ConfigProvider({ children }: { children: React.ReactNode }) {
    const { data: config, isLoading: loading, error } = useConfigQuery();

    const value = {
        config: config ?? null,
        loading,
        error: error ? "Failed to load application configuration" : null,
    };

    return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}
