import apiClient from "./api-client";
import { Computer } from "../types";

export const computerService = {
    // Get computers for the current user
    getUserComputers: async (): Promise<Computer[]> => {
        const response = await apiClient.get<Computer[]>("/api/v1/computers");
        return response.data;
    },

    // Get a computer by ID
    getComputerById: async (computerId: number): Promise<Computer> => {
        const response = await apiClient.get<Computer>(`/api/v1/computers/${computerId.toString()}`);
        return response.data;
    },
};

export default computerService;
