import { useState } from "react";
import { Link, Navigate } from "react-router";

import { useAuth } from "../../contexts/AuthContext";
import { useConfig } from "../../contexts/ConfigContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import { UserRegister } from "../../types";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const { register, loading, error, user } = useAuth();
    const { config, loading: configLoading } = useConfig();

    usePageTitle("Create Account");

    const handleSubmit = async () => {
        setErrorMessage("");

        // Basic validation
        const requiredFields = [username, email, password, confirmPassword];
        if (config?.require_invite_code) {
            requiredFields.push(inviteCode);
        }

        if (requiredFields.some((field) => !field)) {
            setErrorMessage("Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match");
            return;
        }

        if (config && password.length < config.min_password_length) {
            setErrorMessage(`Password must be at least ${config.min_password_length.toString()} characters long`);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErrorMessage("Please enter a valid email address");
            return;
        }

        try {
            const registrationData: UserRegister = { username, email, password };
            if (config?.require_invite_code && inviteCode) {
                registrationData.invite_code = inviteCode;
            }
            await register(registrationData);
        } catch (_error) {
            // Error is handled in the auth context
        }
    };

    // Show loading while config is loading
    if (configLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary-500"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to dashboard if already authenticated
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create a new account</h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{" "}
                        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                            sign in to your existing account
                        </Link>
                    </p>
                </div>

                <form
                    className="mt-8 space-y-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        void handleSubmit();
                    }}
                >
                    <div className="-space-y-px rounded-md shadow-sm">
                        {config?.require_invite_code && (
                            <div>
                                <label htmlFor="invite-code" className="sr-only">
                                    Invite Code
                                </label>
                                <input
                                    id="invite-code"
                                    name="invite-code"
                                    type="text"
                                    required
                                    value={inviteCode}
                                    onChange={(e) => {
                                        setInviteCode(e.target.value.trim().toUpperCase());
                                    }}
                                    className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary-500 focus:ring-primary-500 focus:outline-none sm:text-sm"
                                    placeholder="Invite Code"
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="username" className="sr-only">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                }}
                                className={`relative block w-full appearance-none rounded-none ${
                                    config?.require_invite_code ? "" : "rounded-t-md"
                                } border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary-500 focus:ring-primary-500 focus:outline-none sm:text-sm`}
                                placeholder="Username"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                }}
                                className="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary-500 focus:ring-primary-500 focus:outline-none sm:text-sm"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                }}
                                className="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary-500 focus:ring-primary-500 focus:outline-none sm:text-sm"
                                placeholder={`Password (min ${config?.min_password_length.toString() ?? "8"} characters)`}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="sr-only">
                                Confirm Password
                            </label>
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                }}
                                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary-500 focus:ring-primary-500 focus:outline-none sm:text-sm"
                                placeholder="Confirm password"
                            />
                        </div>
                    </div>

                    {(errorMessage || error) && <div className="text-sm text-red-500">{errorMessage || error}</div>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full cursor-pointer justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none"
                        >
                            {loading ? "Creating account..." : "Create account"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
