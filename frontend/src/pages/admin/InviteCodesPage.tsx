import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState } from "react";

import {
    useCreateInviteCodeMutation,
    useDeleteInviteCodeMutation,
    useInviteCodesQuery,
    useUpdateInviteCodeMutation,
} from "../../hooks/queries/useInviteCodeQueries";
import { usePageTitle } from "../../hooks/usePageTitle";
import { InviteCode, InviteCodeCreate } from "../../types";
import { formatDate, getRelativeTime } from "../../util/date";
import { getApiErrorMessage } from "../../util/error";

export default function InviteCodesPage() {
    const { data: inviteCodes = [], isLoading: loading, error } = useInviteCodesQuery();

    usePageTitle("Invite Codes Administration");

    const createInviteCodeMutation = useCreateInviteCodeMutation();
    const updateInviteCodeMutation = useUpdateInviteCodeMutation();
    const deleteInviteCodeMutation = useDeleteInviteCodeMutation();

    // Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customCode, setCustomCode] = useState("");
    const [modalError, setModalError] = useState<string | null>(null);

    // Handle creating a new invite code
    const handleCreateCode = () => {
        setCustomCode("");
        setModalError(null);
        setIsModalOpen(true);
    };

    // Handle form submission
    const handleSubmit = async () => {
        setModalError(null);

        try {
            const codeData: InviteCodeCreate = {};
            if (customCode.trim()) {
                codeData.code = customCode.trim().toUpperCase();
            }

            await createInviteCodeMutation.mutateAsync(codeData);
            setIsModalOpen(false);
        } catch (err: unknown) {
            const errorMessage = getApiErrorMessage(err, "create invite code");
            setModalError(errorMessage);
        }
    };

    // Handle deactivating an invite code
    const handleDeactivateCode = async (inviteCode: InviteCode) => {
        if (!window.confirm(`Are you sure you want to deactivate the invite code "${inviteCode.code}"?`)) {
            return;
        }

        try {
            await updateInviteCodeMutation.mutateAsync({
                inviteCodeId: inviteCode.id,
                inviteCodeData: { is_active: false },
            });
        } catch (err: unknown) {
            console.error("Failed to deactivate invite code:", err);
        }
    };

    // Handle reactivating an invite code
    const handleReactivateCode = async (inviteCode: InviteCode) => {
        if (inviteCode.used_by_user_id) {
            alert("Cannot reactivate a used invite code.");
            return;
        }

        try {
            await updateInviteCodeMutation.mutateAsync({
                inviteCodeId: inviteCode.id,
                inviteCodeData: { is_active: true },
            });
        } catch (err: unknown) {
            console.error("Failed to reactivate invite code:", err);
        }
    };

    // Handle deleting an invite code
    const handleDeleteCode = async (inviteCode: InviteCode) => {
        if (!window.confirm(`Are you sure you want to delete invite code "${inviteCode.code}"?`)) {
            return;
        }

        try {
            await deleteInviteCodeMutation.mutateAsync(inviteCode.id);
        } catch (err: unknown) {
            console.error("Failed to delete invite code:", err);
        }
    };

    // Copy code to clipboard
    const handleCopyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            alert("Code copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy code:", err);
        }
    };

    const isSubmitting = createInviteCodeMutation.isPending || updateInviteCodeMutation.isPending;

    if (error) {
        return (
            <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Invite Codes</h1>
                    <p className="mt-1 text-gray-600">Manage invite codes for user registration</p>
                </div>
                <button
                    onClick={handleCreateCode}
                    className="cursor-pointer rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
                >
                    Create Invite Code
                </button>
            </div>

            {loading ? (
                <div className="py-10 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                    <p className="mt-2 text-gray-700">Loading invite codes...</p>
                </div>
            ) : inviteCodes.length === 0 ? (
                <div className="rounded-lg bg-white p-6 text-center shadow">
                    <p className="mb-4 text-gray-700">No invite codes have been created yet.</p>
                    <p className="text-gray-600">
                        Click the "Create Invite Code" button to create your first invite code.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Created By
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Used By
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {inviteCodes.map((inviteCode) => (
                                <tr key={inviteCode.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="font-mono text-sm font-medium text-gray-900">
                                                {inviteCode.code}
                                            </div>
                                            <button
                                                onClick={() => void handleCopyCode(inviteCode.code)}
                                                className="ml-2 cursor-pointer text-gray-400 hover:text-primary-600"
                                                title="Copy to clipboard"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {inviteCode.used_by_user_id ? (
                                            <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs leading-5 font-semibold text-gray-800">
                                                Used
                                            </span>
                                        ) : inviteCode.is_active ? (
                                            <span className="inline-flex rounded-full bg-green-100 px-2 text-xs leading-5 font-semibold text-green-800">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex rounded-full bg-red-100 px-2 text-xs leading-5 font-semibold text-red-800">
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {inviteCode.created_by_username ?? "Unknown"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {inviteCode.used_by_username ?? "—"}
                                        </div>
                                        {inviteCode.used_at && (
                                            <div
                                                className="text-xs text-gray-500"
                                                title={formatDate(inviteCode.used_at)}
                                            >
                                                {getRelativeTime(inviteCode.used_at)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div
                                            className="text-sm text-gray-900"
                                            title={formatDate(inviteCode.created_at)}
                                        >
                                            {getRelativeTime(inviteCode.created_at)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                        {!inviteCode.used_by_user_id && (
                                            <>
                                                {inviteCode.is_active ? (
                                                    <button
                                                        onClick={() => void handleDeactivateCode(inviteCode)}
                                                        className="mr-4 cursor-pointer text-orange-600 transition-colors hover:text-orange-900"
                                                        disabled={isSubmitting}
                                                    >
                                                        Deactivate
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => void handleReactivateCode(inviteCode)}
                                                        className="mr-4 cursor-pointer text-green-600 transition-colors hover:text-green-900"
                                                        disabled={isSubmitting}
                                                    >
                                                        Reactivate
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        <button
                                            onClick={() => void handleDeleteCode(inviteCode)}
                                            className="cursor-pointer text-red-600 transition-colors hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={deleteInviteCodeMutation.isPending}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Invite Code modal */}
            <Dialog
                open={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                }}
                transition
                className="fixed inset-0 flex w-screen items-center justify-center bg-black/30 p-4 transition duration-300 ease-out data-closed:opacity-0"
            >
                <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                    <DialogPanel className="inline-block w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                        <DialogTitle as="h3" className="text-lg leading-6 font-medium text-gray-900">
                            Create Invite Code
                        </DialogTitle>

                        {/* Error Display */}
                        {modalError && (
                            <div className="mt-4 border-l-4 border-red-500 bg-red-50 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{modalError}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-4">
                            <label htmlFor="customCode" className="mb-2 block text-sm font-medium text-gray-700">
                                Custom Code (optional)
                            </label>
                            <input
                                type="textZ"
                                name="customCode"
                                id="customCode"
                                value={customCode}
                                onChange={(e) => {
                                    setCustomCode(e.target.value.toUpperCase());
                                    if (modalError) setModalError(null);
                                }}
                                placeholder="Leave blank to auto-generate"
                                className="w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                            <p className="mt-1 text-sm text-gray-500">If left blank, a random code will be generated</p>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsModalOpen(false);
                                }}
                                className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleSubmit()}
                                disabled={isSubmitting}
                                className="cursor-pointer rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting ? "Creating..." : "Create Code"}
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
}
