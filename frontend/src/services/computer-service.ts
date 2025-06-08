import apiClient from "./api-client";
import { Computer } from "../types";

export const computerService = {
    // Get computers for the current user
    getUserComputers: async (): Promise<Computer[]> => {
        const response = await apiClient.get<Computer[]>("/api/v1/users/me/computers");
        return response.data;
    },

    // Get a computer by ID
    getComputerById: async (computerId: string): Promise<Computer> => {
        const response = await apiClient.get<Computer>(`/api/v1/computers/${computerId}`);
        return response.data;
    },
};

export default computerService;
