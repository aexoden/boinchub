/* eslint-disable @typescript-eslint/no-base-to-string */
import { AxiosError } from "axios";

import { ApiError } from "../types";

export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
    console.log(error);
    // If the error is an instance of ApiError, return its message
    if (error instanceof ApiError && error.detail) {
        return error.detail;
    }

    // If the error is an instance of AxiosError, try to find the response object
    if (error instanceof AxiosError) {
        if (error.response) {
            // If the response has a data property, try to extract the message from it
            if (error.response.data && typeof error.response.data === "object") {
                const data = error.response.data as Record<string, unknown>;

                if (data.detail) {
                    return String(data.detail);
                }
                if (data.message) {
                    return String(data.message);
                }
            }
        }
    }

    // If the error is an instance of Error, return its message
    if (error instanceof Error) {
        return error.message;
    }

    // If the error is a string, return it directly
    if (typeof error === "string") {
        return error;
    }

    // If the error is an object with a 'detail' or 'message' property, return that
    if (error && typeof error === "object" && "detail" in error && error.detail) {
        return String(error.detail);
    }

    if (error && typeof error === "object" && "message" in error && error.message) {
        return String(error.message);
    }

    return fallback;
}

export function getAuthErrorMessage(error: unknown): string {
    return getErrorMessage(error, "Authentication failed");
}

export function getApiErrorMessage(error: unknown, operation: string): string {
    return getErrorMessage(error, `Failed to ${operation}`);
}
