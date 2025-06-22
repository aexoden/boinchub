import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

import { ApiError, ErrorResponse, TokenResponse, User } from "../types";

import { tokenStorage } from "./token-storage";

// Create a base API client
const apiClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8501",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

// Helper function to safely check if data matches ErrorResponse
function isErrorResponse(data: unknown): data is ErrorResponse {
    return typeof data === "object" && data !== null && "detail" in data;
}

let isRefreshing = false;
let failedQueue: {
    resolve: (value: string) => void;
    reject: (reason: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else if (token) {
            resolve(token);
        }
    });

    failedQueue = [];
};

// Add a request interceptor to add the token to requests
apiClient.interceptors.request.use(
    (config) => {
        const token = tokenStorage.getAccessToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error),
);

// Add a response interceptor to handle errors and token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If already refreshing, add to the queue
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers && typeof token === "string") {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }

                        return apiClient(originalRequest);
                    })
                    .catch((err: unknown) => {
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Create a separate axios instance for the refresh request to avoid circular interceptor calls
                const refreshClient = axios.create({
                    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8501",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                });

                const response = await refreshClient.post<TokenResponse>("/api/v1/auth/refresh", {});
                const { access_token, expires_in } = response.data;

                // Store new tokens
                tokenStorage.setAccessToken(access_token, expires_in);

                // Update the authorization header for the original request
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                }

                // Process the queue with the new token
                processQueue(null, access_token);

                // Retry the original request
                return await apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                tokenStorage.clearAccessToken();

                processQueue(refreshError, null);

                if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
                    window.location.href = "/login";
                }

                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                return await Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
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
    login: async (username: string, password: string): Promise<TokenResponse> => {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        const response = await apiClient.post<TokenResponse>("/api/v1/auth/login", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        const { access_token, expires_in } = response.data;

        // Store tokens in localStorage
        tokenStorage.setAccessToken(access_token, expires_in);

        return response.data;
    },

    logout: async (): Promise<void> => {
        // Call the backend logout endpoint (this will clear the refresh token cookie)
        try {
            await apiClient.post("/api/v1/auth/logout");
        } catch (error) {
            console.warn("Logout failed:", error);
        } finally {
            tokenStorage.clearAccessToken();
        }
    },

    refresh: async (): Promise<TokenResponse> => {
        const response = await apiClient.post<TokenResponse>("/api/v1/auth/refresh");
        const { access_token, expires_in } = response.data;

        tokenStorage.setAccessToken(access_token, expires_in);

        return response.data;
    },

    isAuthenticated: (): boolean => {
        return tokenStorage.hasAccessToken() && !tokenStorage.isTokenExpired();
    },

    getCurrentUser: async (): Promise<User> => {
        try {
            const response = await apiClient.get<User>("/api/v1/auth/me");
            return response.data;
        } catch (error) {
            // If the request fails, clear the access token
            tokenStorage.clearAccessToken();
            throw error;
        }
    },

    getAccessToken: (): string | null => {
        return tokenStorage.getAccessToken();
    },

    getTokenExpiration: (): Date | null => {
        return tokenStorage.getTokenExpiration();
    },

    isTokenExpired: (bufferSeconds = 60): boolean => {
        return tokenStorage.isTokenExpired(bufferSeconds);
    },
};

export default apiClient;
