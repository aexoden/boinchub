import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useUpdateCurrentUserMutation } from "../../hooks/queries";
import ProjectKeysManagement from "../../components/settings/ProjectKeysManagement";

export default function SettingsPage() {
    const { user } = useAuth();
    const updateUserMutation = useUpdateCurrentUserMutation();

    const [email, setEmail] = useState(user?.email ?? "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    // Handle profile update
    const handleUpdateProfile = async () => {
        if (email === user?.email) {
            setMessage({ text: "No changes to save", type: "error" });
            return;
        }

        setMessage(null);

        try {
            await updateUserMutation.mutateAsync({ email });
            setMessage({ text: "Profile updated successfully", type: "success" });
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

        setMessage(null);

        try {
            await updateUserMutation.mutateAsync({ password: newPassword });
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
                                    value={user?.username ?? ""}
                                    disabled
                                    className="block w-full rounded-md border-gray-300 bg-gray-100 p-2 shadow-sm"
                                />
                                <p className="mt-1 text-sm text-gray-500">Your username cannot be changed</p>
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
                                    }}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-4 w-full rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none"
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
                                    }}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-4 w-full rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none"
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
