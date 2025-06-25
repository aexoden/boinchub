import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import AttachmentStatusDisplay from "../../components/common/AttachmentStatusDisplay";
import ResourceUsageDisplay from "../../components/common/ResourceUsageDisplay";
import {
    useComputerAttachmentsQuery,
    useComputerQuery,
    useCreateAttachmentMutation,
    useCurrentUserProjectKeysQuery,
    useDeleteAttachmentMutation,
    usePreferenceGroupsQuery,
    useProjectsQuery,
    useUpdateComputerMutation,
} from "../../hooks/queries";
import { usePageTitle } from "../../hooks/usePageTitle";
import { ProjectAttachment, ProjectAttachmentCreate } from "../../types";
import { formatDate } from "../../util/date";

export default function ComputerDetailPage() {
    const { computerId } = useParams<{ computerId: string }>();
    const navigate = useNavigate();

    // Queries
    const { data: computer, isLoading: computerLoading, error: computerError } = useComputerQuery(computerId ?? "");
    const { data: attachments = [], isLoading: attachmentsLoading } = useComputerAttachmentsQuery(computerId ?? "");
    const { data: allProjects = [], isLoading: projectsLoading } = useProjectsQuery(true);
    const { data: userProjectKeys = [], isLoading: keysLoading } = useCurrentUserProjectKeysQuery();
    const { data: preferenceGroups = [], isLoading: preferenceGroupsLoading } = usePreferenceGroupsQuery();

    // Mutations
    const createAttachmentMutation = useCreateAttachmentMutation();
    const deleteAttachmentMutation = useDeleteAttachmentMutation();
    const updateComputerMutation = useUpdateComputerMutation();

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<string>("");
    const [resourceShare, setResourceShare] = useState("100");

    // Preference group state
    const [selectedPreferenceGroup, setSelectedPreferenceGroup] = useState<string | null>(null);
    const [isPreferenceGroupModalOpen, setIsPreferenceGroupModalOpen] = useState(false);

    // Error states
    const [pageError, setPageError] = useState<string | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [preferenceGroupError, setPreferenceGroupError] = useState<string | null>(null);

    // Create a map for quick project lookup
    const projectsMap = allProjects.reduce<Record<string, string>>((acc, project) => {
        acc[project.id] = project.name;
        return acc;
    }, {});

    // Set page title
    usePageTitle(computer?.hostname ?? "Loading...");

    // Create a set of project IDs the user has keys for
    const userProjectKeyIds = new Set(userProjectKeys.map((key) => key.project_id));

    // Get projects that are already attached to this computer
    const attachedProjectIds = attachments.map((a) => a.project_id);

    // Get projects available for attachment (enabled, user has key, not already attached)
    const availableProjects = allProjects.filter(
        (p) => p.enabled && userProjectKeyIds.has(p.id) && !attachedProjectIds.includes(p.id),
    );

    // Find current preference group
    const currentPreferenceGroup = preferenceGroups.find((pg) => pg.id === computer?.preference_group_id);

    const handleAddAttachment = () => {
        setSelectedProject("");
        setResourceShare("100");
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleChangePreferenceGroup = () => {
        setSelectedPreferenceGroup(currentPreferenceGroup?.id ?? null);
        setPreferenceGroupError(null);
        setIsPreferenceGroupModalOpen(true);
    };

    const handleToggleVacationOverride = async () => {
        if (!computer) return;

        try {
            await updateComputerMutation.mutateAsync({
                computerId: computer.id,
                computerData: {
                    vacation_override: !computer.vacation_override,
                },
            });

            setPageError(null);
        } catch (err: unknown) {
            let errorMessage = "Failed to toggle vacation override";

            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === "string") {
                errorMessage = err;
            } else if (err && typeof err === "object" && "detail" in err) {
                errorMessage = String(err.detail);
            }

            setPageError(errorMessage);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        if (modalError) {
            setModalError(null);
        }

        switch (field) {
            case "project":
                setSelectedProject(value);
                break;
            case "resourceShare":
                setResourceShare(value);
                break;
        }
    };

    const handleCreateAttachment = async () => {
        setModalError(null);

        if (!selectedProject) {
            setModalError("Please select a project to attach.");
            return;
        }

        if (!computer) {
            setModalError("Computer not found.");
            return;
        }

        const resourceShareNum = Number(resourceShare);
        if (isNaN(resourceShareNum) || resourceShareNum < 0) {
            setModalError("Resource share must be a valid number greater than or equal to 0.");
            return;
        }

        const attachmentData: ProjectAttachmentCreate = {
            computer_id: computer.id,
            project_id: selectedProject,
            resource_share: resourceShareNum,
        };

        try {
            await createAttachmentMutation.mutateAsync(attachmentData);
            setIsModalOpen(false);
            setSelectedProject("");
            setResourceShare("100");
            setPageError(null);
        } catch (err: unknown) {
            let errorMessage = "Failed to attach project";

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

    const handleUpdatePreferenceGroup = async () => {
        setPreferenceGroupError(null);

        if (!computer) {
            setPreferenceGroupError("Computer not found.");
            return;
        }

        try {
            await updateComputerMutation.mutateAsync({
                computerId: computer.id,
                computerData: {
                    preference_group_id: selectedPreferenceGroup ?? undefined,
                },
            });

            setIsPreferenceGroupModalOpen(false);
            setPageError(null);
        } catch (err: unknown) {
            let errorMessage = "Failed to update preference group";

            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === "string") {
                errorMessage = err;
            } else if (err && typeof err === "object" && "detail" in err) {
                errorMessage = String(err.detail);
            }

            setPreferenceGroupError(errorMessage);
        }
    };

    const handleDeleteAttachment = async (attachmentId: string, projectName: string) => {
        if (!window.confirm(`Are you sure you want to detach from ${projectName}?`)) {
            return;
        }

        try {
            await deleteAttachmentMutation.mutateAsync(attachmentId);
            setPageError(null);
        } catch (err: unknown) {
            let errorMessage = "Failed to detach project";

            if (err instanceof Error) {
                errorMessage = err.message;
            } else if (typeof err === "string") {
                errorMessage = err;
            } else if (err && typeof err === "object" && "detail" in err) {
                errorMessage = String(err.detail);
            }

            setPageError(errorMessage);
        }
    };

    // Loading state
    const isLoading =
        computerLoading || attachmentsLoading || projectsLoading || keysLoading || preferenceGroupsLoading;
    const isSubmitting = createAttachmentMutation.isPending || updateComputerMutation.isPending;

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (computerError) {
        return (
            <div className="border-l-4 border-red-500 bg-red-50 p-4">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{computerError.message}</p>
                        <button
                            onClick={() => void navigate("/computers")}
                            className="mt-2 cursor-pointer text-sm font-medium text-red-700 hover:text-red-600"
                        >
                            Go back to computers list
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!computer) {
        return (
            <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">Computer not found</p>
                        <button
                            onClick={() => void navigate("/computers")}
                            className="mt-2 cursor-pointer text-sm font-medium text-yellow-700 hover:text-yellow-600"
                        >
                            Go back to computers list
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{computer.hostname}</h1>
                    <p className="mt-1 text-gray-600">Computer details and attached projects</p>
                </div>
                <button
                    onClick={() => void navigate("/computers")}
                    className="cursor-pointer rounded-md bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300"
                >
                    Back to Computers
                </button>
            </div>

            {/* Error Message */}
            {pageError && (
                <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{pageError}</p>
                            <button
                                onClick={() => {
                                    setPageError(null);
                                }}
                                className="mt-2 cursor-pointer text-sm font-medium text-red-700 hover:text-red-600"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Vacation Override Alert */}
            {computer.vacation_override && (
                <div className="mb-6 border-l-4 border-orange-500 bg-orange-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm font-medium text-orange-700">
                                Vacation override is active. All projects are temporarily set to not request new work.
                            </p>
                            <p className="mt-1 text-sm text-orange-600">
                                Individual project settings are preserved and will be restored when vacation override is
                                disabled.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Computer Details */}
            <div className="mb-8 rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Computer Information</h2>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                void handleToggleVacationOverride();
                            }}
                            disabled={isSubmitting}
                            className={`cursor-pointer rounded-md px-4 py-2 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                computer.vacation_override
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-orange-600 hover:bg-orange-700"
                            }`}
                        >
                            {computer.vacation_override ? "Disable Vacation Override" : "Enable Vacation Override"}
                        </button>
                        <button
                            onClick={handleChangePreferenceGroup}
                            className="cursor-pointer rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
                        >
                            Change Preference Group
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Hostname</h3>
                        <p className="mt-1 text-gray-900">{computer.hostname}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Vacation Override</h3>
                        <p className="mt-1 text-gray-900">
                            <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                    computer.vacation_override
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-green-100 text-green-800"
                                }`}
                            >
                                {computer.vacation_override ? "Active" : "Inactive"}
                            </span>
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Preference Group</h3>
                        <p className="mt-1 text-gray-900">
                            {currentPreferenceGroup ? (
                                <span className="inline-flex items-center">
                                    {currentPreferenceGroup.name}
                                    {currentPreferenceGroup.is_default && (
                                        <span className="ml-2 inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                                            Default
                                        </span>
                                    )}
                                </span>
                            ) : (
                                <span className="text-gray-500">Not assigned</span>
                            )}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">First Seen</h3>
                        <p className="mt-1 text-gray-900">{formatDate(computer.created_at)}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Last Connection</h3>
                        <p className="mt-1 text-gray-900">
                            {computer.last_connected_at ? formatDate(computer.last_connected_at) : "Never"}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">BOINC CPID</h3>
                        <p className="mt-1 font-mono text-gray-900">{computer.cpid}</p>
                    </div>
                </div>
            </div>

            {/* Project Attachments */}
            <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Attached Projects</h2>
                    <button
                        onClick={handleAddAttachment}
                        disabled={availableProjects.length === 0 || isSubmitting}
                        className={`rounded-md px-4 py-2 text-white transition-colors ${
                            availableProjects.length > 0 && !isSubmitting
                                ? "cursor-pointer bg-primary-600 hover:bg-primary-700"
                                : "cursor-not-allowed bg-gray-400"
                        }`}
                        title={
                            availableProjects.length === 0
                                ? "No available projects to attach. Set up project account keys in your settings first."
                                : ""
                        }
                    >
                        Attach Project
                    </button>
                </div>

                {/* Show message if no project keys are set up */}
                {userProjectKeys.length === 0 && (
                    <div className="mb-4 border-l-4 border-yellow-500 bg-yellow-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    You need to set up project account keys before you can attach projects to your
                                    computers.
                                </p>
                                <Link
                                    to="/settings"
                                    className="mt-2 cursor-pointer text-sm font-medium text-yellow-700 hover:text-yellow-600"
                                >
                                    Go to Settings to add project keys
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {attachments.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                        <p>No projects are attached to this computer.</p>
                        {availableProjects.length > 0 ? (
                            <p className="mt-2">Click the "Attach Project" button to add a project.</p>
                        ) : userProjectKeys.length > 0 ? (
                            <p className="mt-2">All available projects are already attached to this computer.</p>
                        ) : (
                            <p className="mt-2">Set up project account keys in Settings to attach projects.</p>
                        )}
                    </div>
                ) : (
                    <ComputerDetailAttachmentTable
                        attachments={attachments}
                        projectsMap={projectsMap}
                        handleDeleteAttachment={handleDeleteAttachment}
                        deleteAttachmentMutation={deleteAttachmentMutation}
                    />
                )}
            </div>

            {/* Add Project Modal */}
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
                            Attach New Project
                        </DialogTitle>

                        {/* Modal Error Display */}
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
                                void handleCreateAttachment();
                            }}
                            className="mt-4"
                        >
                            <div className="mb-4">
                                <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                                    Project
                                </label>
                                <select
                                    id="project"
                                    value={selectedProject}
                                    onChange={(e) => {
                                        handleInputChange("project", e.target.value);
                                    }}
                                    required
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value="" disabled>
                                        Select a project
                                    </option>
                                    {availableProjects.map((project) => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-sm text-gray-500">
                                    Only projects for which you have account keys are shown.
                                </p>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="resourceShare" className="block text-sm font-medium text-gray-700">
                                    Resource Share
                                </label>
                                <input
                                    type="number"
                                    id="resourceShare"
                                    min="0"
                                    step="any"
                                    value={resourceShare}
                                    onChange={(e) => {
                                        handleInputChange("resourceShare", e.target.value);
                                    }}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Determines how much computing resource this project gets relative to others
                                </p>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                    }}
                                    className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="cursor-pointer rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSubmitting ? "Attaching..." : "Attach Project"}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>

            {/* Change Preference Group Modal */}
            <Dialog
                open={isPreferenceGroupModalOpen}
                onClose={() => {
                    setIsPreferenceGroupModalOpen(false);
                }}
                transition
                className="fixed inset-0 flex w-screen items-center justify-center bg-black/30 p-4 transition duration-300 ease-out data-closed:opacity-0"
            >
                <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                    <DialogPanel className="inline-block w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                        <DialogTitle as="h3" className="text-lg leading-6 font-medium text-gray-900">
                            Change Preference Group
                        </DialogTitle>

                        {/* Preference Group Error Display */}
                        {preferenceGroupError && (
                            <div className="mt-4 border-l-4 border-red-500 bg-red-50 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{preferenceGroupError}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                void handleUpdatePreferenceGroup();
                            }}
                            className="mt-4"
                        >
                            <div className="mb-4">
                                <label htmlFor="preferenceGroup" className="block text-sm font-medium text-gray-700">
                                    Preference Group
                                </label>
                                <select
                                    id="preferenceGroup"
                                    value={selectedPreferenceGroup ?? ""}
                                    onChange={(e) => {
                                        setSelectedPreferenceGroup(e.target.value);
                                        if (preferenceGroupError) setPreferenceGroupError(null);
                                    }}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option disabled value="">
                                        Select a preference group
                                    </option>
                                    {preferenceGroups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                            {group.is_default && " (Default)"}
                                            {group.user_id === null && " (Global)"}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-sm text-gray-500">
                                    Choose a preference group to control BOINC computing preferences for this computer.
                                </p>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPreferenceGroupModalOpen(false);
                                    }}
                                    className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateComputerMutation.isPending}
                                    className="cursor-pointer rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {updateComputerMutation.isPending ? "Updating..." : "Update Preference Group"}
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
}

interface ComputerDetailAttachmentTableProps {
    attachments: ProjectAttachment[];
    projectsMap: Record<string, string>;
    handleDeleteAttachment: (attachmentId: string, projectName: string) => Promise<void>;
    deleteAttachmentMutation: ReturnType<typeof useDeleteAttachmentMutation>;
}

function ComputerDetailAttachmentTable({
    attachments,
    projectsMap,
    handleDeleteAttachment,
    deleteAttachmentMutation,
}: ComputerDetailAttachmentTableProps) {
    const sortedAttachments = useMemo(() => {
        return [...attachments].sort((a, b) => {
            const nameA = projectsMap[a.project_id] || "Unknown Project";
            const nameB = projectsMap[b.project_id] || "Unknown Project";
            return nameA.localeCompare(nameB);
        });
    }, [attachments, projectsMap]);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                            Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                            Resource Share
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                            Resources
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
                    {sortedAttachments.map((attachment) => {
                        const projectName = projectsMap[attachment.project_id] || "Unknown Project";

                        return (
                            <tr key={attachment.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{projectName}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{attachment.resource_share}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <ResourceUsageDisplay attachment={attachment} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <AttachmentStatusDisplay attachment={attachment} />{" "}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                    <Link
                                        to={`/attachments/${attachment.id}`}
                                        className="mr-4 cursor-pointer text-primary-600 hover:text-primary-900"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => {
                                            void handleDeleteAttachment(attachment.id, projectName);
                                        }}
                                        className="cursor-pointer text-red-600 transition-colors hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                                        disabled={deleteAttachmentMutation.isPending}
                                    >
                                        {deleteAttachmentMutation.isPending ? "Detaching..." : "Detach"}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
