import {
    AdjustmentsHorizontalIcon,
    ChevronDownIcon,
    Cog6ToothIcon,
    ComputerDesktopIcon,
    CpuChipIcon,
    ExclamationTriangleIcon,
    NoSymbolIcon,
    PauseIcon,
    PlayIcon,
    PlusIcon,
    ServerIcon,
    SunIcon,
    TrashIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import AttachmentStatusDisplay from "../../components/common/AttachmentStatusDisplay";
import { useConfig } from "../../contexts/ConfigContext";
import {
    useComputerAttachmentsQuery,
    useCreateAttachmentMutation,
    useCurrentUserComputersQuery,
    useCurrentUserProjectKeysQuery,
    useDeleteAttachmentMutation,
    usePreferenceGroupsQuery,
    useProjectsQuery,
    useUpdateAttachmentMutation,
    useUpdateComputerMutation,
} from "../../hooks/queries";
import { usePageTitle } from "../../hooks/usePageTitle";
import { Computer, ProjectAttachment, ProjectAttachmentCreate, ProjectAttachmentUpdate } from "../../types";
import { formatDate, getRelativeTime } from "../../util/date";
import { getApiErrorMessage } from "../../util/error";

interface ResourceBadgeProps {
    type: string;
    enabled: boolean;
    className?: string;
    onClick?: () => void;
    interactive?: boolean;
}

function ResourceBadge({ type, enabled, className = "", onClick, interactive = false }: ResourceBadgeProps) {
    const configs = {
        CPU: { color: "blue", icon: CpuChipIcon },
        NVIDIA: { color: "green", icon: CpuChipIcon },
        AMD: { color: "red", icon: CpuChipIcon },
        Intel: { color: "purple", icon: CpuChipIcon },
    };

    const config = configs[type as keyof typeof configs];
    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${
                enabled ? `bg-${config.color}-100 text-${config.color}-800` : "bg-gray-100 text-gray-400 line-through"
            } ${interactive ? "cursor-pointer transition-colors hover:ring-2 hover:ring-primary-500" : ""} ${className}`}
            onClick={onClick}
            title={interactive ? `Click to ${enabled ? "disable" : "enable"} ${type}` : undefined}
        >
            <Icon className="h-3 w-3" />
            {type}
        </span>
    );
}

interface AttachmentRowProps {
    attachment: ProjectAttachment;
    projectName: string;
    computerName: string;
    onEdit: (attachment: ProjectAttachment) => void;
    onDelete: (attachment: ProjectAttachment, projectName: string, computerName: string) => Promise<void>;
    onQuickAction: (attachmentId: string, action: string) => Promise<void>;
    onResourceToggle: (attachmentId: string, resourceType: string, currentValue: boolean) => Promise<void>;
}

function AttachmentRow({
    attachment,
    projectName,
    computerName,
    onEdit,
    onDelete,
    onQuickAction,
    onResourceToggle,
}: AttachmentRowProps) {
    return (
        <div className="border-b border-gray-200 p-3 transition-colors last:border-b-0 hover:bg-gray-50">
            {/* Top row: Project name, status, actions */}
            <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h4 className="truncate font-medium text-gray-900" title={projectName}>
                        {projectName}
                    </h4>
                </div>

                <div className="flex items-center gap-2">
                    <AttachmentStatusDisplay attachment={attachment} />

                    {/* Quick actions */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => {
                                void onQuickAction(
                                    attachment.id,
                                    attachment.dont_request_more_work ? "allow_work" : "no_work",
                                );
                            }}
                            className={`rounded p-1.5 transition-colors ${
                                attachment.dont_request_more_work
                                    ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                                    : "text-gray-400 hover:bg-gray-100 hover:text-orange-600"
                            }`}
                            title={attachment.dont_request_more_work ? "Allow new work" : "Don't request more work"}
                        >
                            <NoSymbolIcon className="h-4 w-4" />
                        </button>

                        <button
                            onClick={() => {
                                void onQuickAction(attachment.id, attachment.suspended ? "resume" : "suspend");
                            }}
                            className={`rounded p-1.5 transition-colors ${
                                attachment.suspended
                                    ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                                    : "text-gray-400 hover:bg-gray-100 hover:text-yellow-600"
                            }`}
                            title={attachment.suspended ? "Resume" : "Suspend"}
                        >
                            {attachment.suspended ? (
                                <PlayIcon className="h-4 w-4" />
                            ) : (
                                <PauseIcon className="h-4 w-4" />
                            )}
                        </button>

                        <button
                            onClick={() => {
                                onEdit(attachment);
                            }}
                            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            title="Edit Settings"
                        >
                            <Cog6ToothIcon className="h-4 w-4" />
                        </button>

                        <button
                            onClick={() => void onDelete(attachment, projectName, computerName)}
                            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600"
                            title="Detach Project"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom row: Resource share and badges */}
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                    Resource Share: <span className="font-medium">{attachment.resource_share}</span>
                </span>

                <div className="flex gap-1">
                    <ResourceBadge
                        type="CPU"
                        enabled={!attachment.no_cpu}
                        interactive
                        onClick={() => void onResourceToggle(attachment.id, "cpu", !attachment.no_cpu)}
                    />
                    <ResourceBadge
                        type="NVIDIA"
                        enabled={!attachment.no_gpu_nvidia}
                        interactive
                        onClick={() => void onResourceToggle(attachment.id, "gpu_nvidia", !attachment.no_gpu_nvidia)}
                    />
                    <ResourceBadge
                        type="AMD"
                        enabled={!attachment.no_gpu_amd}
                        interactive
                        onClick={() => void onResourceToggle(attachment.id, "gpu_amd", !attachment.no_gpu_amd)}
                    />
                    <ResourceBadge
                        type="Intel"
                        enabled={!attachment.no_gpu_intel}
                        interactive
                        onClick={() => void onResourceToggle(attachment.id, "gpu_intel", !attachment.no_gpu_intel)}
                    />
                </div>
            </div>
        </div>
    );
}

interface ComputerCardProps {
    computer: Computer;
    onAddAttachment: (computer: Computer) => void;
    onEditAttachment: (attachment: ProjectAttachment) => void;
    onDeleteAttachment: (attachment: ProjectAttachment, projectName: string, computerName: string) => Promise<void>;
    onQuickAction: (attachmentId: string, action: string) => Promise<void>;
    onResourceToggle: (attachmentId: string, resourceType: string, currentValue: boolean) => Promise<void>;
    onComputerSettings: (computer: Computer) => void;
    onVacationToggle: (computer: Computer) => Promise<void>;
}

function ComputerCard({
    computer,
    onAddAttachment,
    onEditAttachment,
    onDeleteAttachment,
    onQuickAction,
    onResourceToggle,
    onComputerSettings,
    onVacationToggle,
}: ComputerCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const { data: attachments = [], isLoading: attachmentsLoading } = useComputerAttachmentsQuery(computer.id);
    const { data: preferenceGroups = [] } = usePreferenceGroupsQuery();
    const { data: projects = [] } = useProjectsQuery(true);

    const preferenceGroup = preferenceGroups.find((pg) => pg.id === computer.preference_group_id);

    const projectsMap = projects.reduce<Record<string, string>>((acc, project) => {
        acc[project.id] = project.name;
        return acc;
    }, {});

    const sortedAttachments = [...attachments].sort((a, b) => {
        const projectNameA = projectsMap[a.project_id] ?? "Unknown Project";
        const projectNameB = projectsMap[b.project_id] ?? "Unknown Project";
        return projectNameA.localeCompare(projectNameB);
    });

    const activeAttachments = attachments.filter((a) => !a.suspended && !a.dont_request_more_work).length;
    const totalAttachments = attachments.length;

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
            {/* Header */}
            <div className="p-4">
                <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={`rounded-lg p-2.5 ${computer.vacation_override ? "bg-orange-100" : "bg-blue-100"}`}
                        >
                            <ComputerDesktopIcon
                                className={`h-5 w-5 ${computer.vacation_override ? "text-orange-600" : "text-blue-600"}`}
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate text-lg font-semibold text-gray-900" title={computer.hostname}>
                                {computer.hostname}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span
                                    title={
                                        computer.last_connected_at
                                            ? formatDate(computer.last_connected_at)
                                            : "Never seen"
                                    }
                                >
                                    {computer.last_connected_at
                                        ? getRelativeTime(computer.last_connected_at)
                                        : "Never seen"}
                                </span>
                                {computer.last_connected_at && <span className="text-gray-300">•</span>}
                                <span className="font-mono text-xs">{computer.cpid.substring(0, 8)}...</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {computer.vacation_override && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                                <ExclamationTriangleIcon className="h-3 w-3" />
                                Vacation
                            </span>
                        )}

                        <button
                            onClick={() => void onVacationToggle(computer)}
                            className={`rounded-lg p-2 transition-colors ${
                                computer.vacation_override
                                    ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                                    : "text-gray-400 hover:bg-gray-100 hover:text-orange-600"
                            }`}
                            title={computer.vacation_override ? "Disable vacation mode" : "Enable vacation mode"}
                        >
                            <SunIcon className="h-4 w-4" />
                        </button>

                        <button
                            onClick={() => {
                                onComputerSettings(computer);
                            }}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            title="Computer Settings"
                        >
                            <Cog6ToothIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mb-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">{totalAttachments}</div>
                            <div className="text-xs text-gray-500">Projects</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{activeAttachments}</div>
                            <div className="text-xs text-gray-500">Active</div>
                        </div>
                    </div>

                    <div className="min-w-0 flex-1 text-right">
                        <div
                            className="truncate text-sm font-medium text-gray-700"
                            title={preferenceGroup?.name ?? "No profile"}
                        >
                            {preferenceGroup?.name ?? "No profile"}
                        </div>
                        <div className="text-xs text-gray-500">Preference Group</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            onAddAttachment(computer);
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add Project
                    </button>

                    <button
                        onClick={() => {
                            setIsExpanded(!isExpanded);
                        }}
                        className="inline-flex w-48 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        <span>{isExpanded ? "Hide" : "Show"} Projects</span>
                        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Expanded Attachments */}
            {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50/50">
                    {attachmentsLoading ? (
                        <div className="p-6 text-center">
                            <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
                            <span className="ml-2 text-sm text-gray-600">Loading projects...</span>
                        </div>
                    ) : attachments.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            <ServerIcon className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                            <p className="mb-2 text-sm">No projects attached</p>
                            <button
                                onClick={() => {
                                    onAddAttachment(computer);
                                }}
                                className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-800"
                            >
                                Add your first project
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white">
                            {sortedAttachments.map((attachment) => (
                                <AttachmentRow
                                    key={attachment.id}
                                    attachment={attachment}
                                    projectName={projectsMap[attachment.project_id] || "Unknown Project"}
                                    computerName={computer.hostname}
                                    onEdit={onEditAttachment}
                                    onDelete={onDeleteAttachment}
                                    onQuickAction={onQuickAction}
                                    onResourceToggle={onResourceToggle}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

interface AttachmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    computer: Computer | null;
    attachment: ProjectAttachment | null;
    mode: "add" | "edit" | null;
}

function AttachmentModal({ isOpen, onClose, computer, attachment, mode }: AttachmentModalProps) {
    const [formData, setFormData] = useState({
        project_id: attachment?.project_id ?? "",
        resource_share: attachment?.resource_share ?? 100,
        suspended: attachment?.suspended ?? false,
        dont_request_more_work: attachment?.dont_request_more_work ?? false,
        detach_when_done: attachment?.detach_when_done ?? false,
        no_cpu: attachment?.no_cpu ?? false,
        no_gpu_nvidia: attachment?.no_gpu_nvidia ?? false,
        no_gpu_amd: attachment?.no_gpu_amd ?? false,
        no_gpu_intel: attachment?.no_gpu_intel ?? false,
    });

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: projects = [] } = useProjectsQuery(true);
    const { data: userProjectKeys = [] } = useCurrentUserProjectKeysQuery();
    const { data: attachments = [] } = useComputerAttachmentsQuery(computer?.id ?? "", { enabled: !!computer });

    const createAttachmentMutation = useCreateAttachmentMutation();
    const updateAttachmentMutation = useUpdateAttachmentMutation();

    const isEditing = mode === "edit";
    const userProjectKeyIds = new Set(userProjectKeys.map((key) => key.project_id));
    const attachedProjectIds = attachments.map((a) => a.project_id);

    const availableProjects = projects.filter((p) => {
        return p.enabled && userProjectKeyIds.has(p.id) && (isEditing || !attachedProjectIds.includes(p.id));
    });

    // Reset form when modal opens/closes or attachment changes
    useEffect(() => {
        if (isOpen && attachment) {
            setFormData({
                project_id: attachment.project_id,
                resource_share: attachment.resource_share,
                suspended: attachment.suspended,
                dont_request_more_work: attachment.dont_request_more_work,
                detach_when_done: attachment.detach_when_done,
                no_cpu: attachment.no_cpu,
                no_gpu_nvidia: attachment.no_gpu_nvidia,
                no_gpu_amd: attachment.no_gpu_amd,
                no_gpu_intel: attachment.no_gpu_intel,
            });
        } else if (isOpen && !attachment) {
            setFormData({
                project_id: "",
                resource_share: 100,
                suspended: false,
                dont_request_more_work: false,
                detach_when_done: false,
                no_cpu: false,
                no_gpu_nvidia: false,
                no_gpu_amd: false,
                no_gpu_intel: false,
            });
        }

        setError(null);
        setShowAdvanced(false);
    }, [isOpen, attachment]);

    const handleSubmit = async () => {
        if (!computer) return;

        setError(null);

        if (!formData.project_id) {
            setError("Please select a project");
            return;
        }

        if (formData.resource_share < 0) {
            setError("Resource share must be 0 or greater");
            return;
        }

        try {
            if (isEditing && attachment) {
                const updateData: ProjectAttachmentUpdate = {
                    resource_share: formData.resource_share,
                    suspended: formData.suspended,
                    dont_request_more_work: formData.dont_request_more_work,
                    detach_when_done: formData.detach_when_done,
                    no_cpu: formData.no_cpu,
                    no_gpu_nvidia: formData.no_gpu_nvidia,
                    no_gpu_amd: formData.no_gpu_amd,
                    no_gpu_intel: formData.no_gpu_intel,
                };

                await updateAttachmentMutation.mutateAsync({
                    attachmentId: attachment.id,
                    attachmentData: updateData,
                });
            } else {
                const createData: ProjectAttachmentCreate = {
                    computer_id: computer.id,
                    project_id: formData.project_id,
                    resource_share: formData.resource_share,
                    suspended: formData.suspended,
                    dont_request_more_work: formData.dont_request_more_work,
                    detach_when_done: formData.detach_when_done,
                    no_cpu: formData.no_cpu,
                    no_gpu_nvidia: formData.no_gpu_nvidia,
                    no_gpu_amd: formData.no_gpu_amd,
                    no_gpu_intel: formData.no_gpu_intel,
                };

                await createAttachmentMutation.mutateAsync(createData);
            }

            onClose();
        } catch (err: unknown) {
            const errorMessage = getApiErrorMessage(err, isEditing ? "update attachment" : "create attachment");
            setError(errorMessage);
        }
    };

    const isSubmitting = createAttachmentMutation.isPending || updateAttachmentMutation.isPending;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {isEditing ? "Edit Project Attachment" : "Add Project to"} {computer?.hostname}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="max-h-[calc(90vh-140px)] space-y-6 overflow-y-auto p-6">
                    {/* Error Display */}
                    {error && (
                        <div className="border-l-4 border-red-500 bg-red-50 p-4">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Project Selection */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Project</label>
                        {isEditing ? (
                            <div className="rounded-lg bg-gray-50 p-3 font-medium text-gray-900">
                                {projects.find((p) => p.id === formData.project_id)?.name ?? "Unknown Project"}
                            </div>
                        ) : (
                            <select
                                value={formData.project_id}
                                onChange={(e) => {
                                    setFormData({ ...formData, project_id: e.target.value });
                                }}
                                className="w-full rounded-lg border border-gray-300 p-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                                required
                            >
                                <option disabled value="">
                                    Select a project...
                                </option>
                                {availableProjects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        {!isEditing && availableProjects.length === 0 && (
                            <p className="mt-1 text-sm text-orange-600">
                                No projects available. Make sure you have project account keys set up in Settings.
                            </p>
                        )}
                    </div>

                    {/* Resource Share */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Resource Share</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={formData.resource_share}
                                onChange={(e) => {
                                    setFormData({ ...formData, resource_share: parseFloat(e.target.value) });
                                }}
                                className="w-full rounded-lg border border-gray-300 p-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500">
                                relative priority
                            </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Higher values get more computing resources relative to other projects
                        </p>
                    </div>

                    {/* Basic Options */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Status</h3>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.dont_request_more_work}
                                    onChange={(e) => {
                                        setFormData({ ...formData, dont_request_more_work: e.target.checked });
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div>
                                    <div className="font-medium text-gray-900">Don't request more work</div>
                                    <div className="text-sm text-gray-500">
                                        Finish current tasks but don't download new ones
                                    </div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.suspended}
                                    onChange={(e) => {
                                        setFormData({ ...formData, suspended: e.target.checked });
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div>
                                    <div className="font-medium text-gray-900">Suspend project</div>
                                    <div className="text-sm text-gray-500">
                                        Temporarily stop all work for this project
                                    </div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.detach_when_done}
                                    onChange={(e) => {
                                        setFormData({ ...formData, detach_when_done: e.target.checked });
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div>
                                    <div className="font-medium text-gray-900">Detach when done</div>
                                    <div className="text-sm text-gray-500">
                                        Remove project after completing all current work
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Advanced Options */}
                    <div>
                        <button
                            onClick={() => {
                                setShowAdvanced(!showAdvanced);
                            }}
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                        >
                            <AdjustmentsHorizontalIcon className="h-4 w-4" />
                            <span className="font-medium">Resource Usage Settings</span>
                            <ChevronDownIcon
                                className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                            />
                        </button>

                        {showAdvanced && (
                            <div className="mt-4 space-y-3 rounded-lg bg-gray-50 p-4">
                                <p className="mb-3 text-sm text-gray-600">
                                    Control which types of processors this project can use
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.no_cpu}
                                            onChange={(e) => {
                                                setFormData({ ...formData, no_cpu: e.target.checked });
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm">Don't use CPU</span>
                                    </label>

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.no_gpu_nvidia}
                                            onChange={(e) => {
                                                setFormData({ ...formData, no_gpu_nvidia: e.target.checked });
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm">Don't use NVIDIA GPU</span>
                                    </label>

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.no_gpu_amd}
                                            onChange={(e) => {
                                                setFormData({ ...formData, no_gpu_amd: e.target.checked });
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm">Don't use AMD GPU</span>
                                    </label>

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.no_gpu_intel}
                                            onChange={(e) => {
                                                setFormData({ ...formData, no_gpu_intel: e.target.checked });
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm">Don't use Intel GPU</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 border-t border-gray-200 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                void handleSubmit();
                            }}
                            disabled={isSubmitting || availableProjects.length === 0}
                            className="flex-1 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting
                                ? isEditing
                                    ? "Saving..."
                                    : "Adding..."
                                : isEditing
                                  ? "Save Changes"
                                  : "Add Project"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ComputerSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    computer: Computer | null;
}

function ComputerSettingsModal({ isOpen, onClose, computer }: ComputerSettingsModalProps) {
    const [selectedPreferenceGroup, setSelectedPreferenceGroup] = useState(computer?.preference_group_id ?? "");
    const [vacationOverride, setVacationOverride] = useState(computer?.vacation_override ?? false);
    const [error, setError] = useState<string | null>(null);

    const { data: preferenceGroups = [] } = usePreferenceGroupsQuery();
    const updateComputerMutation = useUpdateComputerMutation();

    useEffect(() => {
        if (isOpen && computer) {
            setSelectedPreferenceGroup(computer.preference_group_id);
            setVacationOverride(computer.vacation_override);
            setError(null);
        }
    }, [isOpen, computer]);

    const handleSubmit = async () => {
        if (!computer) return;

        setError(null);

        try {
            await updateComputerMutation.mutateAsync({
                computerId: computer.id,
                computerData: {
                    preference_group_id: selectedPreferenceGroup || undefined,
                    vacation_override: vacationOverride,
                },
            });

            onClose();
        } catch (err: unknown) {
            const errorMessage = getApiErrorMessage(err, "update computer settings");
            setError(errorMessage);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900">Settings for {computer?.hostname}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-6 p-6">
                    {/* Error Display */}
                    {error && (
                        <div className="border-l-4 border-red-500 bg-red-50 p-4">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Preference Group</label>
                        <select
                            value={selectedPreferenceGroup}
                            onChange={(e) => {
                                setSelectedPreferenceGroup(e.target.value);
                            }}
                            className="w-full rounded-lg border border-gray-300 p-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">No preference group</option>
                            {preferenceGroups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.name} {group.is_default && "(Default)"}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={vacationOverride}
                                onChange={(e) => {
                                    setVacationOverride(e.target.checked);
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <div>
                                <div className="font-medium text-gray-900">Vacation override</div>
                                <div className="text-sm text-gray-500">
                                    Temporarily suspend all projects without losing their individual settings
                                </div>
                            </div>
                        </label>
                    </div>

                    <div className="rounded-lg bg-blue-50 p-4">
                        <div className="text-sm">
                            <div className="mb-1 font-medium text-blue-900">Computer Info</div>
                            <div className="space-y-1 text-blue-700">
                                <div>
                                    CPID: <code className="text-xs">{computer?.cpid}</code>
                                </div>
                                <div
                                    title={
                                        computer?.last_connected_at
                                            ? formatDate(computer.last_connected_at)
                                            : formatDate(computer?.created_at ?? "")
                                    }
                                >
                                    Last seen:{" "}
                                    {computer?.last_connected_at
                                        ? getRelativeTime(computer.last_connected_at)
                                        : getRelativeTime(computer?.created_at ?? "")}
                                </div>
                                <div title={computer ? formatDate(computer.created_at) : ""}>
                                    Added: {computer ? getRelativeTime(computer.created_at) : ""}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 border-t border-gray-200 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            disabled={updateComputerMutation.isPending}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                void handleSubmit();
                            }}
                            disabled={updateComputerMutation.isPending}
                            className="flex-1 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {updateComputerMutation.isPending ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ComputersPage() {
    const { config } = useConfig();

    // Queries
    const { data: computers = [], isLoading: computersLoading, error: computersError } = useCurrentUserComputersQuery();

    // Modal state
    const [selectedComputer, setSelectedComputer] = useState<Computer | null>(null);
    const [selectedAttachment, setSelectedAttachment] = useState<ProjectAttachment | null>(null);
    const [modalMode, setModalMode] = useState<"add" | "edit" | "settings" | null>(null);

    // Mutations
    const deleteAttachmentMutation = useDeleteAttachmentMutation();
    const updateAttachmentMutation = useUpdateAttachmentMutation();
    const updateComputerMutation = useUpdateComputerMutation();

    usePageTitle("My Computers");

    const handleAddAttachment = (computer: Computer) => {
        setSelectedComputer(computer);
        setSelectedAttachment(null);
        setModalMode("add");
    };

    const handleEditAttachment = (attachment: ProjectAttachment) => {
        const computer = computers.find((c) => c.id === attachment.computer_id);

        if (computer) {
            setSelectedComputer(computer);
            setSelectedAttachment(attachment);
            setModalMode("edit");
        }
    };

    const handleDeleteAttachment = async (attachment: ProjectAttachment, projectName: string, computerName: string) => {
        if (window.confirm(`Are you sure you want to detach "${projectName}" from "${computerName}"?`)) {
            try {
                await deleteAttachmentMutation.mutateAsync(attachment.id);
            } catch (err) {
                console.error("Failed to delete attachment:", err);
            }
        }
    };

    const handleQuickAction = async (attachmentId: string, action: string) => {
        try {
            const updateData: Partial<ProjectAttachmentUpdate> = {};

            switch (action) {
                case "suspend":
                    updateData.suspended = true;
                    break;
                case "resume":
                    updateData.suspended = false;
                    break;
                case "no_work":
                    updateData.dont_request_more_work = true;
                    break;
                case "allow_work":
                    updateData.dont_request_more_work = false;
                    break;
            }

            await updateAttachmentMutation.mutateAsync({
                attachmentId,
                attachmentData: updateData,
            });
        } catch (err) {
            console.error("Failed to update attachment:", err);
        }
    };

    const handleResourceToggle = async (attachmentId: string, resourceType: string, currentValue: boolean) => {
        try {
            const updateData: Partial<ProjectAttachmentUpdate> = {};

            switch (resourceType) {
                case "cpu":
                    updateData.no_cpu = currentValue;
                    break;
                case "gpu_nvidia":
                    updateData.no_gpu_nvidia = currentValue;
                    break;
                case "gpu_amd":
                    updateData.no_gpu_amd = currentValue;
                    break;
                case "gpu_intel":
                    updateData.no_gpu_intel = currentValue;
                    break;
            }

            await updateAttachmentMutation.mutateAsync({
                attachmentId,
                attachmentData: updateData,
            });
        } catch (err) {
            console.error("Failed to update attachment resource:", err);
        }
    };

    const handleComputerSettings = (computer: Computer) => {
        setSelectedComputer(computer);
        setModalMode("settings");
    };

    const handleVacationToggle = async (computer: Computer) => {
        try {
            await updateComputerMutation.mutateAsync({
                computerId: computer.id,
                computerData: {
                    vacation_override: !computer.vacation_override,
                },
            });
        } catch (err) {
            console.error("Failed to toggle vacation mode:", err);
        }
    };

    const closeModal = () => {
        setSelectedComputer(null);
        setSelectedAttachment(null);
        setModalMode(null);
    };

    if (computersError) {
        return (
            <div className="mb-6 border-l-4 border-red-500 bg-red-50 p-4">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{computersError.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="mb-2 text-3xl font-bold text-gray-900">My Computers</h1>
                    <p className="text-gray-600">Manage your BOINC computers and their project attachments</p>
                </div>

                {computersLoading ? (
                    <div className="py-10 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                        <p className="mt-2 text-gray-700">Loading your computers...</p>
                    </div>
                ) : computers.length === 0 ? (
                    <div className="py-12 text-center">
                        <ComputerDesktopIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                        <h3 className="mb-2 text-lg font-medium text-gray-900">No computers found</h3>
                        <p className="mb-6 text-gray-500">
                            Connect your BOINC client to this account manager to get started
                        </p>
                        <div className="mx-auto max-w-md rounded-lg bg-gray-100 p-4">
                            <p className="mb-2 text-sm text-gray-600">Account Manager URL:</p>
                            <code className="rounded border bg-white px-3 py-2 text-sm">
                                {config?.boinc_url ?? "Loading..."}
                            </code>
                        </div>
                    </div>
                ) : (
                    /* Computers Grid */
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {computers.map((computer) => (
                            <ComputerCard
                                key={computer.id}
                                computer={computer}
                                onAddAttachment={handleAddAttachment}
                                onEditAttachment={handleEditAttachment}
                                onDeleteAttachment={handleDeleteAttachment}
                                onQuickAction={handleQuickAction}
                                onResourceToggle={handleResourceToggle}
                                onComputerSettings={handleComputerSettings}
                                onVacationToggle={handleVacationToggle}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <AttachmentModal
                isOpen={modalMode === "add" || modalMode === "edit"}
                onClose={closeModal}
                computer={selectedComputer}
                attachment={selectedAttachment}
                mode={modalMode === "add" ? "add" : modalMode === "edit" ? "edit" : null}
            />

            <ComputerSettingsModal isOpen={modalMode === "settings"} onClose={closeModal} computer={selectedComputer} />
        </div>
    );
}
