import apiClient from "./api-client";

export interface AppConfig {
    account_manager_name: string;
    boinc_url: string;
    min_password_length: number;
}

export const configService = {
    // Get the application configuration
    getConfig: async (): Promise<AppConfig> => {
        const response = await apiClient.get<AppConfig>("/api/v1/config");
        return response.data;
    },
};

export default configService;
