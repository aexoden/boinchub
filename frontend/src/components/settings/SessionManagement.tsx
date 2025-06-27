import { ComputerDesktopIcon, DevicePhoneMobileIcon, GlobeAltIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { useLogoutAllOtherSessionsMutation, useRevokeSessionMutation, useUserSessionsQuery } from "../../hooks/queries";
import { UserSession } from "../../types";
import { formatDate } from "../../util/date";
import { getApiErrorMessage } from "../../util/error";

export default function SessionManagement() {
    const { data: sessions = [], isLoading: loading, error } = useUserSessionsQuery();
    const revokeSessionMutation = useRevokeSessionMutation();
    const logoutAllMutation = useLogoutAllOtherSessionsMutation();

    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    // Helper function to get device icon based on user agent
    const getDeviceIcon = (userAgent: string) => {
        const ua = userAgent.toLowerCase();

        if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
            return DevicePhoneMobileIcon;
        }

        return ComputerDesktopIcon;
    };

    // Helper function to get a readable device name
    const getDeviceName = (session: UserSession) => {
        if (session.device_name) {
            return session.device_name;
        }

        return "Unknown Device";
    };

    // Helper function to get location info (simplified)
    const getLocationInfo = (ipAddress: string) => {
        if (
            ipAddress.startsWith("127.") ||
            ipAddress.startsWith("192.168.") ||
            ipAddress.startsWith("10.") ||
            ipAddress === "::1"
        ) {
            return "Local Network";
        }

        return ipAddress;
    };

    const handleRevokeSession = async (sessionId: string, deviceName: string) => {
        if (
            !window.confirm(
                `Are you sure you want to revoke the session for "${deviceName}"? This will immediately log out that device.`,
            )
        ) {
            return;
        }

        try {
            await revokeSessionMutation.mutateAsync(sessionId);
            setMessage({ text: "Session revoked successfully", type: "success" });
        } catch (err: unknown) {
            const errorMessage = getApiErrorMessage(err, "revoke session");
            setMessage({ text: errorMessage, type: "error" });
        }
    };

    const handleLogoutAllOther = async () => {
        const otherSessions = sessions.filter((session) => !session.is_current);

        if (otherSessions.length === 0) {
            setMessage({ text: "No other sessions to logout", type: "error" });
            return;
        }

        if (
            !window.confirm(
                `Are you sure you want to logout all other sessions? This will log out ${otherSessions.length.toString()} device(s).`,
            )
        ) {
            return;
        }

        try {
            await logoutAllMutation.mutateAsync();
            setMessage({ text: "All other sessions logged out successfully", type: "success" });
        } catch (err: unknown) {
            const errorMessage = getApiErrorMessage(err, "logout other sessions");
            setMessage({ text: errorMessage, type: "error" });
        }
    };

    // Sort sessions with current session first
    const sortedSessions = [...sessions].sort((a, b) => {
        if (a.is_current && !b.is_current) return -1;
        if (!a.is_current && b.is_current) return 1;
        return new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime();
    });

    if (error) {
        return (
            <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Active Sessions</h2>
                <div className="border-l-4 border-red-500 bg-red-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error.message}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium text-gray-900">Active Sessions</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage devices that are currently logged in to your account.
                    </p>
                </div>
                {sessions.filter((s) => !s.is_current).length > 0 && (
                    <button
                        onClick={() => void handleLogoutAllOther()}
                        disabled={logoutAllMutation.isPending}
                        className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {logoutAllMutation.isPending ? "Logging out..." : "Logout All Other Sessions"}
                    </button>
                )}
            </div>

            {/* Message Display */}
            {message && (
                <div
                    className={`mb-4 rounded-md p-4 ${
                        message.type === "success"
                            ? "border border-green-200 bg-green-50 text-green-800"
                            : "border border-red-200 bg-red-50 text-red-800"
                    }`}
                >
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm">{message.text}</p>
                        </div>
                        <button
                            onClick={() => {
                                setMessage(null);
                            }}
                            className="ml-auto text-sm font-medium hover:underline"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="py-4 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading sessions...</span>
                </div>
            ) : sortedSessions.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                    <p>No active sessions found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedSessions.map((session) => {
                        const DeviceIcon = getDeviceIcon(session.user_agent);
                        const deviceName = getDeviceName(session);
                        const locationInfo = getLocationInfo(session.ip_address);

                        return (
                            <div
                                key={session.id}
                                className={`rounded-lg border p-4 ${
                                    session.is_current
                                        ? "border-primary-200 bg-primary-50"
                                        : "border-gray-200 bg-white hover:bg-gray-50"
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                            <DeviceIcon
                                                className={`h-8 w-8 ${
                                                    session.is_current ? "text-primary-600" : "text-gray-400"
                                                }`}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="text-sm font-medium text-gray-900">{deviceName}</h3>
                                                {session.is_current && (
                                                    <span className="inline-flex rounded-full bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-800">
                                                        Current Session
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1 space-y-1">
                                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                    <GlobeAltIcon className="h-4 w-4" />
                                                    <span>{locationInfo}</span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Last active: {formatDate(session.last_accessed_at)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Created: {formatDate(session.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {!session.is_current && (
                                        <button
                                            onClick={() => void handleRevokeSession(session.id, deviceName)}
                                            disabled={revokeSessionMutation.isPending}
                                            className="flex cursor-pointer items-center space-x-1 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            title="Revoke this session"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                            <span>Revoke</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
