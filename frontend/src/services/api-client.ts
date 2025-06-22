import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { TokenPair, RefreshTokenRequest, ApiError, ErrorResponse } from "../types";

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

// Token storage helpers
const TOKEN_STORAGE_KEY = "access_token";
const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";

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
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);

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

            const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

            if (refreshToken) {
                try {
                    const refreshRequest: RefreshTokenRequest = {
                        refresh_token: refreshToken,
                    };

                    // Create a separate axios instance for the refresh request to avoid circular interceptor calls
                    const refreshClient = axios.create({
                        baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8501",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });

                    const response = await refreshClient.post<TokenPair>("/api/v1/auth/refresh", refreshRequest);
                    const { access_token, refresh_token } = response.data;

                    // Store new tokens
                    localStorage.setItem(TOKEN_STORAGE_KEY, access_token);
                    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refresh_token);

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
                    localStorage.removeItem(TOKEN_STORAGE_KEY);
                    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);

                    processQueue(refreshError, null);

                    if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
                        window.location.href = "/login";
                    }

                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    return await Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            } else {
                // No refresh token available, redirect to login
                localStorage.removeItem(TOKEN_STORAGE_KEY);
                localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);

                if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
                    window.location.href = "/login";
                }
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
    login: async (username: string, password: string): Promise<TokenPair> => {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        const response = await apiClient.post<TokenPair>("/api/v1/auth/login", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        const { access_token, refresh_token } = response.data;

        // Store tokens in localStorage
        localStorage.setItem(TOKEN_STORAGE_KEY, access_token);
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refresh_token);

        return response.data;
    },

    logout: async (): Promise<void> => {
        // Call the backend logout endpoint if we have a token
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);

        if (token) {
            try {
                await apiClient.post("/api/v1/auth/logout");
            } catch (error) {
                console.warn("Logout failed:", error);
            }
        }

        // Clear tokens from localStorage
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem(TOKEN_STORAGE_KEY);
    },

    getAccessToken: (): string | null => {
        return localStorage.getItem(TOKEN_STORAGE_KEY);
    },

    getRefershToken: (): string | null => {
        return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    },
};

export default apiClient;
