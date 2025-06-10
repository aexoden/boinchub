import { useEffect, useState } from "react";
import { AppConfig } from "../../services/config-service";
import { configService } from "../../services/config-service";
import { ConfigContext } from "../../contexts/ConfigContext";

export default function ConfigProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const appConfig = await configService.getConfig();
                setConfig(appConfig);
            } catch (err) {
                console.error("Failed to load application configuration", err);
                setError("Failed to load application configuration");

                // Fallback to default configuration
                setConfig({
                    account_manager_name: "BoincHub",
                    boinc_url: window.location.origin + "/boinc/",
                    min_password_length: 8,
                });
            } finally {
                setLoading(false);
            }
        };

        void loadConfig();
    }, []);

    const value = {
        config,
        loading,
        error,
    };

    return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}
