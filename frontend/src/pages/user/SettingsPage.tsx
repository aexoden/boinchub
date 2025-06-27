import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import ProjectKeysManagement from "../../components/settings/ProjectKeysManagement";
import SessionManagement from "../../components/settings/SessionManagement";
import { useAuth } from "../../contexts/AuthContext";
import { useConfig } from "../../contexts/ConfigContext";
import { useUpdateCurrentUserMutation } from "../../hooks/queries";
import { usePageTitle } from "../../hooks/usePageTitle";
import { getApiErrorMessage } from "../../util/error";

export default function SettingsPage() {
    const { config } = useConfig();
    const { user } = useAuth();
    const updateUserMutation = useUpdateCurrentUserMutation();

    usePageTitle("Account Settings");

    // Profile form state
    const [username, setUsername] = useState(user?.username ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [currentPasswordForProfile, setCurrentPasswordForProfile] = useState("");

    // Password form state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // BOINC password form state
    const [currentPasswordForBoinc, setCurrentPasswordForBoinc] = useState("");
    const [newBoincPassword, setNewBoincPassword] = useState("");
    const [confirmBoincPassword, setConfirmBoincPassword] = useState("");

    // Message state
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    // Check if profile has changes
    const hasProfileChanges = username !== user?.username || email !== user.email;
    const usernameChanged = username !== user?.username;

    // Handle profile update
    const handleUpdateProfile = async () => {
        if (!hasProfileChanges) {
            setMessage({ text: "No changes to save", type: "error" });
            return;
        }

        // If username changed, require current password
        if (usernameChanged && !currentPasswordForProfile) {
            setMessage({
                text: "Current password is required to change username",
                type: "error",
            });

            return;
        }

        setMessage(null);

        try {
            await updateUserMutation.mutateAsync({
                username: username !== user?.username ? username : undefined,
                email: email !== user?.email ? email : undefined,
                current_password: usernameChanged ? currentPasswordForProfile : undefined,
            });

            setMessage({ text: "Profile updated successfully", type: "success" });
            setCurrentPasswordForProfile("");

            // If username changed, user will need to log in again
            if (usernameChanged) {
                setMessage({
                    text: "Username updated successfully. You will need to log in again with your new username.",
                    type: "success",
                });
            }
        } catch (err: unknown) {
            const errorMessage = getApiErrorMessage(err, "update profile");
            setMessage({ text: errorMessage, type: "error" });
        }
    };

    // Handle regular password change
    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setMessage({ text: "All password fields are required", type: "error" });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ text: "New passwords don't match", type: "error" });
            return;
        }

        if (config && newPassword.length < config.min_password_length) {
            setMessage({
                text: `Password must be at least ${config.min_password_length.toString()} characters long`,
                type: "error",
            });
            return;
        }

        setMessage(null);

        try {
            await updateUserMutation.mutateAsync({ password: newPassword, current_password: currentPassword });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setMessage({ text: "Password changed successfully", type: "success" });
        } catch (err: unknown) {
            const errorMessage = getApiErrorMessage(err, "change password");
            setMessage({ text: errorMessage, type: "error" });
        }
    };

    // Handle BOINC password change
    const handleChangeBoincPassword = async () => {
        if (!currentPasswordForBoinc || !newBoincPassword || !confirmBoincPassword) {
            setMessage({ text: "All BOINC password fiels are required", type: "error" });
            return;
        }

        if (newBoincPassword !== confirmBoincPassword) {
            setMessage({ text: "New BOINC passwords don't match", type: "error" });
            return;
        }

        if (config && newBoincPassword.length < config.min_password_length) {
            setMessage({
                text: `BOINC password must be at least ${config.min_password_length.toString()} characters long`,
                type: "error",
            });
        }

        setMessage(null);

        try {
            await updateUserMutation.mutateAsync({
                boinc_password: newBoincPassword,
                current_password: currentPasswordForBoinc,
            });

            setMessage({ text: "BOINC password changed successfully", type: "success" });
            setCurrentPasswordForBoinc("");
            setNewBoincPassword("");
            setConfirmBoincPassword("");
        } catch (err: unknown) {
            const errorMessage = getApiErrorMessage(err, "change BOINC password");
            setMessage({ text: errorMessage, type: "error" });
        }
    };

    // Handle reset BOINC password to match regular password
    const handleResetBoincPassword = async () => {
        if (!currentPasswordForBoinc) {
            setMessage({ text: "Current password is required to reset BOINC password", type: "error" });
            return;
        }

        setMessage(null);

        try {
            await updateUserMutation.mutateAsync({
                boinc_password: "", // Empty string signals to reset to regular password
                current_password: currentPasswordForBoinc,
            });

            setMessage({ text: "BOINC password reset to match your regular password", type: "success" });
            setCurrentPasswordForBoinc("");
            setNewBoincPassword("");
            setConfirmBoincPassword("");
        } catch (err: unknown) {
            const errorMessage = getApiErrorMessage(err, "reset BOINC password");
            setMessage({ text: errorMessage, type: "error" });
        }
    };

    const isLoading = updateUserMutation.isPending;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                <p className="mt-1 text-gray-600">
                    Manage your account settings, project keys, sessions, and change your passwords
                </p>
            </div>

            <div className="space-y-6">
                {/* Project Keys Management */}
                <ProjectKeysManagement />

                {/* Session Management */}
                <SessionManagement />

                {/* Message Display */}
                {message && (
                    <div
                        className={`rounded-md p-4 ${
                            message.type === "success"
                                ? "border border-green-200 bg-green-50 text-green-800"
                                : "border border-red-200 bg-red-50 text-red-800"
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Profile Settings */}
                    <div className="rounded-lg bg-white p-6 shadow">
                        <h2 className="mb-4 text-lg font-medium text-gray-900">Profile Information</h2>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                void handleUpdateProfile();
                            }}
                        >
                            <div className="mb-4">
                                <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value.trim());
                                        if (message?.type === "error") setMessage(null);
                                    }}
                                    className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                                {usernameChanged && (
                                    <p className="mt-1 text-sm text-amber-600">
                                        ⚠️ Changing your username will require you to reconfigure any BOINC clients that
                                        are connected to this account manager.
                                    </p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (message?.type === "error") setMessage(null);
                                    }}
                                    className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                />
                            </div>

                            {usernameChanged && (
                                <div className="mb-4">
                                    <label
                                        htmlFor="current-password-profile"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        id="current-password-profile"
                                        className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        value={currentPasswordForProfile}
                                        onChange={(e) => {
                                            setCurrentPasswordForProfile(e.target.value);
                                            if (message?.type === "error") setMessage(null);
                                        }}
                                        required={usernameChanged}
                                        placeholder="Required for username changes"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Required to verify your identity when changing username
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !hasProfileChanges}
                                className="mt-4 w-full cursor-pointer rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isLoading ? "Saving..." : "Save Changes"}
                            </button>
                        </form>
                    </div>

                    {/* Password Settings */}
                    <div className="rounded-lg bg-white p-6 shadow">
                        <h2 className="mb-4 text-lg font-medium text-gray-900">Change Web Login Password</h2>
                        <p className="mb-4 text-sm text-gray-600">
                            This password is used for logging into the web interface and is stored securely with Argon2
                            hashing. If your BOINC password matches this password, it will be kept in sync.
                        </p>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                void handleChangePassword();
                            }}
                        >
                            <div className="mb-4">
                                <label
                                    htmlFor="current-password"
                                    className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    id="current-password"
                                    className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    value={currentPassword}
                                    onChange={(e) => {
                                        setCurrentPassword(e.target.value);
                                        if (message?.type === "error") setMessage(null);
                                    }}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-gray-700">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    id="new-password"
                                    className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        if (message?.type === "error") setMessage(null);
                                    }}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label
                                    htmlFor="confirm-password"
                                    className="mb-1 block text-sm font-medium text-gray-700"
                                >
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    id="confirm-password"
                                    className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (message?.type === "error") setMessage(null);
                                    }}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-4 w-full cursor-pointer rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isLoading ? "Changing..." : "Change Password"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* BOINC Password Settings */}
                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-lg font-medium text-gray-900">BOINC Password Settings</h2>
                    <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">About BOINC Passwords</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>
                                        BOINC uses MD5 hashing for passwords, which is weaker than modern standards.
                                        This password has nothing to do with any accounts you may have with BOINC
                                        projects. It is solely used to authenticate your BOINC clients with this account
                                        manager. By default, it is the same as your account password. However, by
                                        setting a separate BOINC password, you can:
                                    </p>
                                    <ul className="mt-2 list-disc space-y-1 pl-5">
                                        <li>Use a strong password for web login that's stored securely</li>
                                        <li>
                                            Use a different password for BOINC clients that limits damage if compromised
                                        </li>
                                        <li>
                                            If someone cracks your password for BOINC clients, they can only attach
                                            computers to your account
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Set Custom BOINC Password */}
                        <div>
                            <h3 className="text-md mb-4 font-medium text-gray-900">Set Custom BOINC Password</h3>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    void handleChangeBoincPassword();
                                }}
                            >
                                <div className="mb-4">
                                    <label
                                        htmlFor="current-password-boinc"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Current Web Password
                                    </label>
                                    <input
                                        type="password"
                                        id="current-password-boinc"
                                        className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        value={currentPasswordForBoinc}
                                        onChange={(e) => {
                                            setCurrentPasswordForBoinc(e.target.value);
                                            if (message?.type === "error") setMessage(null);
                                        }}
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label
                                        htmlFor="new-boinc-password"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        New BOINC Password
                                    </label>
                                    <input
                                        type="password"
                                        id="new-boinc-password"
                                        className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        value={newBoincPassword}
                                        onChange={(e) => {
                                            setNewBoincPassword(e.target.value);
                                            if (message?.type === "error") setMessage(null);
                                        }}
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label
                                        htmlFor="confirm-boinc-password"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Confirm BOINC Password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirm-boinc-password"
                                        className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        value={confirmBoincPassword}
                                        onChange={(e) => {
                                            setConfirmBoincPassword(e.target.value);
                                            if (message?.type === "error") setMessage(null);
                                        }}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full cursor-pointer rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isLoading ? "Setting..." : "Set BOINC Password"}
                                </button>
                            </form>
                        </div>

                        {/* Reset BOINC Password */}
                        <div>
                            <h3 className="text-md mb-4 font-medium text-gray-900">Reset to Web Password</h3>
                            <p className="mb-4 text-sm text-gray-600">
                                Reset your BOINC password to match your web login password.
                            </p>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    void handleResetBoincPassword();
                                }}
                            >
                                <div className="mb-4">
                                    <label
                                        htmlFor="current-password-reset"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Current Web Password
                                    </label>
                                    <input
                                        type="password"
                                        id="current-password-reset"
                                        className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        value={currentPasswordForBoinc}
                                        onChange={(e) => {
                                            setCurrentPasswordForBoinc(e.target.value);
                                            if (message?.type === "error") setMessage(null);
                                        }}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full cursor-pointer rounded-md bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isLoading ? "Resetting..." : "Reset BOINC Password"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
