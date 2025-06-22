import { Computer, ComputerUpdate } from "../types";

import apiClient from "./api-client";

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

    // Update a computer
    updateComputer: async (computerId: string, computerData: ComputerUpdate): Promise<Computer> => {
        const response = await apiClient.patch<Computer>(`/api/v1/computers/${computerId}`, computerData);
        return response.data;
    },
};

export default computerService;
