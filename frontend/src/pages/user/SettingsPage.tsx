import { useState } from "react";
import { useConfig } from "../../contexts/ConfigContext";
import { useAuth } from "../../contexts/AuthContext";
import { useUpdateCurrentUserMutation } from "../../hooks/queries";
import ProjectKeysManagement from "../../components/settings/ProjectKeysManagement";

export default function SettingsPage() {
    const { config } = useConfig();
    const { user } = useAuth();
    const updateUserMutation = useUpdateCurrentUserMutation();

    // Profile form state
    const [username, setUsername] = useState(user?.username ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [currentPasswordForProfile, setCurrentPasswordForProfile] = useState("");

    // Password form state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

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
            const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
            setMessage({ text: errorMessage, type: "error" });
        }
    };

    // Handle password change
    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setMessage({ text: "Please fill in all password fields", type: "error" });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ text: "New passwords do not match", type: "error" });
            return;
        }

        if (config && newPassword.length < config.min_password_length) {
            setMessage({
                text: `New password must be at least ${config.min_password_length.toString()} characters long`,
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
            const errorMessage = err instanceof Error ? err.message : "Failed to change password";
            setMessage({ text: errorMessage, type: "error" });
        }
    };

    const isLoading = updateUserMutation.isPending;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                <p className="mt-1 text-gray-600">
                    Manage your account settings, project keys, and change your password
                </p>
            </div>

            <div className="space-y-6">
                {/* Project Keys Management */}
                <ProjectKeysManagement />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    className="block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (message?.type === "error") setMessage(null);
                                    }}
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
                        <h2 className="mb-4 text-lg font-medium text-gray-900">Change Password</h2>
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
                                <label htmlFor="new-password" className="font-medim mb-1 block text-sm text-gray-700">
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

                {/* Alert Message */}
                {message && (
                    <div
                        className={`rounded-md p-4 ${
                            message.type === "success"
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-red-500 bg-red-50 text-red-700"
                        } border-l-4`}
                    >
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
}
