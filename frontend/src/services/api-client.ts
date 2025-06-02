import axios, { AxiosError, AxiosInstance } from "axios";
import { AuthResponse, ApiError, ErrorResponse } from "../types";

// Create a base API client
const apiClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8501",
    headers: {
        "Content-Type": "application/json",
    },
});

// Helper function to safely check if data matches ErrorResponse
function isErrorResponse(data: unknown): data is ErrorResponse {
    return typeof data === "object" && data !== null && "detail" in data;
}

// Add a request interceptor to add the token to requests
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error),
);

// Add a response interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // Handle 401 Unauthorized - redirect to login
        if (error.response?.status === 401) {
            localStorage.removeItem("token");

            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        const errorData = error.response?.data;
        const detail = isErrorResponse(errorData) ? errorData.detail : undefined;

        // Format error for consistent handling
        const apiError = new ApiError(error.response?.status ?? 500, error.message, detail);

        return Promise.reject(apiError);
    },
);

// Authentication service
export const authService = {
    login: async (username: string, password: string): Promise<AuthResponse> => {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        const response = await apiClient.post<AuthResponse>("/api/v1/auth/login", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        localStorage.setItem("token", response.data.access_token);

        return response.data;
    },

    logout: (): void => {
        localStorage.removeItem("token");
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem("token");
    },
};

export default apiClient;
