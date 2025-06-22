import { useEffect } from "react";

import { useConfig } from "../contexts/ConfigContext";

export function usePageTitle(title: string) {
    const { config } = useConfig();

    useEffect(() => {
        const appName = config?.account_manager_name ?? "BoincHub";
        document.title = `${title} | ${appName}`;

        return () => {
            document.title = appName;
        };
    }, [title, config?.account_manager_name]);
}
