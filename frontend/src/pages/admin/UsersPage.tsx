import { useState } from "react";
import { User, UserUpdate } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { useUsersQuery, useUpdateUserMutation, useDeleteUserMutation } from "../../hooks/queries";
import { getRoleDisplayName, getRoleColor, canChangeRoles, isSuperAdmin } from "../../util/user";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const { data: users = [], isLoading: loading, error } = useUsersQuery();

    const updateUserMutation = useUpdateUserMutation();
    const deleteUserMutation = useDeleteUserMutation();

    // Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<UserUpdate & { new_password?: string }>({
        username: "",
        email: "",
        new_password: "",
        role: "user",
        is_active: true,
    });

    // Modal error state
    const [modalError, setModalError] = useState<string | null>(null);

    const canCurrentUserChangeRoles = currentUser ? canChangeRoles(currentUser) : false;
    const isCurrentUserSuperAdmin = currentUser ? isSuperAdmin(currentUser) : false;

    // Open modal for editing user
    const handleEditUser = (user: User) => {
        setEditingUser(user);

        setFormData({
            username: user.username,
            email: user.email,
            is_active: user.is_active,
            role: user.role,
            new_password: "",
        });

        setModalError(null);
        setIsModalOpen(true);
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === "checkbox" ? e.target.checked : undefined;

        if (modalError) {
            setModalError(null);
        }

        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!editingUser) return;

        setModalError(null);

        // Prepare update payload
        const payload: UserUpdate = {
            email: formData.email !== editingUser.email ? formData.email : undefined,
            username: formData.username !== editingUser.username ? formData.username : undefined,
            role: canCurrentUserChangeRoles && formData.role !== editingUser.role ? formData.role : undefined,
            is_active: formData.is_active !== editingUser.is_active ? formData.is_active : undefined,
        };

        // Include password if provided
        if (formData.new_password) {
            payload.password = formData.new_password;
        }

        // Check if there are any changes
        if (!Object.values(payload).some((value) => !!value)) {
            setModalError("No changes to save");
            return;
        }

        try {
            await updateUserMutation.mutateAsync({ userId: editingUser.id, userData: payload });
            setIsModalOpen(false);
        } catch (err: unknown) {
            let errorMessage = "An unexpected error occurred";

            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === "string") {
                errorMessage = err;
            } else if (err && typeof err === "object" && "detail" in err) {
                errorMessage = String(err.detail);
            }

            setModalError(errorMessage);
        }
    };

    // Handle user deletion
    const handleDeleteUser = async (userId: string, userToDelete: User) => {
        if (userToDelete.id === currentUser?.id) {
            alert("You cannot delete your own account.");
            return;
        }

        if (!window.confirm(`Are you sure you want to delete user "${userToDelete.username}"?`)) {
            return;
        }

        try {
            await deleteUserMutation.mutateAsync(userId);
        } catch (err: unknown) {
            let errorMessage = "Failed to delete user";

            if (err instanceof Error) {
                errorMessage = err.message;
            }

            alert(errorMessage);
        }
    };

    // Check if current user can edit a specific user
    const canEditUser = (targetUser: User): boolean => {
        if (!currentUser) return false;

        // Users can edit themselves
        if (currentUser.id === targetUser.id) return true;

        // Super admins can edit anyone except other super admins
        if (isCurrentUserSuperAdmin) {
            return !isSuperAdmin(targetUser);
        }

        // Regular admins can only edit regular users
        return currentUser.role === "admin" && targetUser.role === "user";
    };

    // Check if current user can delete a specific user
    const canDeleteUser = (targetUser: User): boolean => {
        if (!currentUser) return false;

        // Can't delete yourself
        if (currentUser.id === targetUser.id) return false;

        return canEditUser(targetUser);
    };

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
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                <p className="mt-1 text-gray-600">Manage user accounts in the system</p>
            </div>

            {loading ? (
                <div className="py-10 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                    <p className="mt-2 text-gray-700">Loading users...</p>
                </div>
            ) : users.length === 0 ? (
                <div className="rounded-lg bg-white p-6 text-center shadow">
                    <p className="text-gray-700">No users found.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Username
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">
                                            {user.username}
                                            {user.id === currentUser?.id && (
                                                <span className="ml-2 text-xs text-gray-500">(You)</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${getRoleColor(user.role)}`}
                                        >
                                            {getRoleDisplayName(user.role)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.is_active ? (
                                            <span className="inline-flex rounded-full bg-green-100 px-2 text-xs leading-5 font-semibold text-green-800">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex rounded-full bg-red-100 px-2 text-xs leading-5 font-semibold text-red-800">
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="whitespace-no-wrap px-6 py-4 text-right text-sm font-medium">
                                        {canEditUser(user) && (
                                            <button
                                                onClick={() => {
                                                    handleEditUser(user);
                                                }}
                                                className="mr-4 text-primary-600 hover:text-primary-900"
                                                disabled={updateUserMutation.isPending}
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {canDeleteUser(user) && (
                                            <button
                                                onClick={() => void handleDeleteUser(user.id, user)}
                                                className="text-red-600 hover:text-red-900"
                                                disabled={deleteUserMutation.isPending}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* User Edit Modal */}
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
                            Edit User: {editingUser?.username}
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

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                void handleSubmit();
                            }}
                            className="mt-4"
                        >
                            <div className="mb-4">
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    id="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                                {formData.username !== editingUser?.username && (
                                    <p className="mt-1 text-xs text-amber-600">
                                        ⚠️ Changing username requires setting a new password
                                    </p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    name="new_password"
                                    id="new_password"
                                    value={formData.new_password}
                                    onChange={handleInputChange}
                                    placeholder="Leave blank to keep current password"
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                                {formData.username !== editingUser?.username && (
                                    <p className="mt-1 text-xs text-gray-500">Required when changing username</p>
                                )}
                            </div>

                            {canCurrentUserChangeRoles && editingUser && !isSuperAdmin(editingUser) && (
                                <div className="mb-4">
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                        Role
                                    </label>
                                    <select
                                        name="role"
                                        id="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                        {isCurrentUserSuperAdmin && <option value="super_admin">Super Admin</option>}
                                    </select>
                                </div>
                            )}

                            <div className="mb-4 flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-700">
                                    Active
                                </label>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                    }}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateUserMutation.isPending}
                                    className="rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                                >
                                    {updateUserMutation.isPending ? "Updating..." : "Update User"}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
}
