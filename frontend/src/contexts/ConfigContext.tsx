import { createContext, useContext } from "react";

import { AppConfig } from "../services/config-service";

interface ConfigContextType {
    config: AppConfig | null;
    loading: boolean;
    error: string | null;
}

// Create the context
export const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function useConfig() {
    const context = useContext(ConfigContext);

    if (context === undefined) {
        throw new Error("useConfig must be used within a ConfigProvider");
    }

    return context;
}
