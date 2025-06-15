import { useState } from "react";
import { useNavigate } from "react-router";
import { PreferenceGroup } from "../../types";
import { usePreferenceGroupsQuery, useDeletePreferenceGroupMutation } from "../../hooks/queries";
import { useAuth } from "../../contexts/AuthContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

export default function PreferenceGroupsPage() {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [scope, setScope] = useState<string>("available");

    const { data: preferenceGroups = [], isLoading: loading, error } = usePreferenceGroupsQuery(scope);

    usePageTitle("Preference Groups");

    const deletePreferenceGroupMutation = useDeletePreferenceGroupMutation();

    // Handle creating a new preference group
    const handleCreateGroup = () => {
        void navigate("/preference-groups/new");
    };

    // Handle editing a preference group
    const handleEditGroup = (group: PreferenceGroup) => {
        void navigate(`/preference-groups/${group.id}/edit`);
    };

    // Handle preference group deletion
    const handleDeleteGroup = async (group: PreferenceGroup) => {
        // Don't allow deletion of default groups
        if (group.is_default) {
            alert("Cannot delete the default preference group. Please set another group as default first.");
            return;
        }

        if (!window.confirm(`Are you sure you want to delete "${group.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await deletePreferenceGroupMutation.mutateAsync(group.id);
        } catch (err: unknown) {
            let errorMessage = "Failed to delete preference group";

            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === "string") {
                errorMessage = err;
            } else if (err && typeof err === "object" && "detail" in err) {
                errorMessage = (err as { detail: string }).detail || "An unexpected error occurred";
            }

            alert(errorMessage);
        }
    };

    // Check if user can edit a preference group
    const canEditGroup = (group: PreferenceGroup) => {
        // Users can edit their own groups
        if (group.user_id === user?.id) {
            return true;
        }

        // Admins can edit any group
        return isAdmin();
    };

    // Check if user can delete a preference group
    const canDeleteGroup = (group: PreferenceGroup) => {
        // Can't delete default groups
        if (group.is_default) {
            return false;
        }

        // Apply same rules as edit.
        return canEditGroup(group);
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
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Preference Groups</h1>
                    <p className="mt-1 text-gray-600">Manage BOINC computing preferences for your computers</p>
                </div>
                <button
                    onClick={handleCreateGroup}
                    className="flex cursor-pointer items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
                >
                    <PlusIcon className="h-5 w-5" />
                    Create Group
                </button>
            </div>

            {/* Scope Filter */}
            <div className="mb-6">
                <div className="flex space-x-4">
                    <button
                        onClick={() => {
                            setScope("available");
                        }}
                        className={`rounded-md px-4 py-2 transition-colors ${
                            scope === "available"
                                ? "bg-primary-600 text-white"
                                : "cursor-pointer bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        Available Groups
                    </button>
                    <button
                        onClick={() => {
                            setScope("personal");
                        }}
                        className={`rounded-md px-4 py-2 transition-colors ${
                            scope === "personal"
                                ? "bg-primary-600 text-white"
                                : "cursor-pointer bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        My Groups
                    </button>
                    <button
                        onClick={() => {
                            setScope("global");
                        }}
                        className={`rounded-md px-4 py-2 transition-colors ${
                            scope === "global"
                                ? "bg-primary-600 text-white"
                                : "cursor-pointer bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        Global Groups
                    </button>
                    {isAdmin() && (
                        <button
                            onClick={() => {
                                setScope("all");
                            }}
                            className={`rounded-md px-4 py-2 transition-colors ${
                                scope === "all"
                                    ? "bg-primary-600 text-white"
                                    : "cursor-pointer bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            All Groups
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="py-10 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                    <p className="mt-2 text-gray-700">Loading preference groups...</p>
                </div>
            ) : preferenceGroups.length === 0 ? (
                <div className="rounded-lg bg-white p-6 text-center shadow">
                    <p className="mb-4 text-gray-700">No preference groups found in this category.</p>
                    <p className="text-gray-600">
                        Click the "Create Group" button to create your first preference group.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {preferenceGroups.map((group) => (
                        <PreferenceGroupCard
                            key={group.id}
                            group={group}
                            canEdit={canEditGroup(group)}
                            canDelete={canDeleteGroup(group)}
                            onEdit={() => {
                                handleEditGroup(group);
                            }}
                            onDelete={() => void handleDeleteGroup(group)}
                            isDeleting={deletePreferenceGroupMutation.isPending}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Preference Group Card Component
interface PreferenceGroupCardProps {
    group: PreferenceGroup;
    canEdit: boolean;
    canDelete: boolean;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting: boolean;
}

function PreferenceGroupCard({ group, canEdit, canDelete, onEdit, onDelete, isDeleting }: PreferenceGroupCardProps) {
    return (
        <div className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900">
                        {group.name}
                        <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                group.user_id === null ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                            }`}
                        >
                            {group.user_id === null ? "Global" : "Personal"}
                        </span>
                        {group.is_default && (
                            <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                                Default
                            </span>
                        )}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    {canEdit && (
                        <button
                            onClick={onEdit}
                            className="cursor-pointer p-2 text-gray-400 transition-colors hover:text-primary-600"
                        >
                            <PencilIcon className="h-5 w-5" />
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={onDelete}
                            disabled={isDeleting}
                            className="cursor-pointer p-2 text-gray-400 transition-colors hover:text-red-600 disabled:opacity-50"
                            title="Delete preference group"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            <p className="mb-4 text-sm text-gray-600">{group.description || "No description provided."}</p>

            <div className="space-y-2 text-sm">
                <PreferenceGroupSummary group={group} />
            </div>

            {canEdit && (
                <button
                    onClick={onEdit}
                    className="mt-4 w-full cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                    View & Edit Settings
                </button>
            )}
        </div>
    );
}

function PreferenceGroupSummary({ group }: { group: PreferenceGroup }) {
    const summaryItems = [
        {
            label: "CPU Usage",
            value: group.cpu_usage_limit === 100 ? "100%" : `${Math.round(group.cpu_usage_limit).toString()}%`,
            active: true,
        },
        {
            label: "CPU Cores",
            value: group.max_ncpus_pct == 0.0 ? "All" : `${Math.round(group.max_ncpus_pct).toString()}%`,
            active: true,
        },
        {
            label: "Run on Battery",
            value: group.run_on_batteries ? "Yes" : "No",
            active: group.run_on_batteries,
        },
        {
            label: "Time Restriction",
            value:
                group.start_hour == 0 && group.end_hour == 0
                    ? "24/7"
                    : `${group.start_hour.toString()}:00 - ${group.end_hour.toString()}:00`,
            active: group.start_hour !== 0 || group.end_hour !== 0,
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-2">
            {summaryItems.map((item) => (
                <div key={item.label} className="flex justify-between">
                    <span className="text-gray-500">{item.label}</span>
                    <span className={item.active ? "font-medium text-gray-900" : "text-gray-400"}>{item.value}</span>
                </div>
            ))}
        </div>
    );
}
