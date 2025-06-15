import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { QuestionMarkCircleIcon } from "@heroicons/react/16/solid";
import { PreferenceGroupCreate } from "../../types";
import {
    usePreferenceGroupQuery,
    useCreatePreferenceGroupMutation,
    useUpdatePreferenceGroupMutation,
} from "../../hooks/queries/usePreferenceGroupQueries";
import { usePageTitle } from "../../hooks/usePageTitle";

function NumericInput({
    id,
    name,
    value,
    onChange,
    min = 0,
    max,
    suffix = "",
    zeroMeaning = "",
    className = "",
}: {
    id: string;
    name: string;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    min?: number;
    max?: number;
    suffix?: string;
    zeroMeaning?: string;
    className?: string;
}) {
    return (
        <div>
            <div className="relative">
                <input
                    type="number"
                    id={id}
                    name={name}
                    value={value}
                    onChange={onChange}
                    min={min}
                    max={max}
                    step="any"
                    className={`mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${className}`}
                />
                {suffix && (
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center pr-3">
                        <span className="text-sm text-gray-500">{suffix}</span>
                    </div>
                )}
            </div>
            {zeroMeaning && value === 0 && <p className="mt-1 text-xs text-blue-600">{zeroMeaning}</p>}
        </div>
    );
}

function Section({
    title,
    description,
    children,
    defaultOpen = false,
    variant = "default",
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    variant?: "default" | "important" | "advanced";
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const variantStyles = {
        default: "bg-white border-gray-200",
        important: "bg-blue-50 border-blue-200",
        advanced: "bg-gray-50 border-gray-300",
    };

    return (
        <div className={`rounded-lg border shadow-sm ${variantStyles[variant]}`}>
            <button
                type="button"
                onClick={() => {
                    setIsOpen(!isOpen);
                }}
                className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-gray-50"
            >
                <div>
                    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                    {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
                </div>
                {isOpen ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                )}
            </button>
            {isOpen && <div className="space-y-6 border-t border-gray-200 p-6">{children}</div>}
        </div>
    );
}

function InfoTooltip({ text }: { text: string }) {
    const [show, setShow] = useState(false);

    return (
        <div className="relative ml-1 inline-block">
            <QuestionMarkCircleIcon
                className="h-4 w-4 cursor-help text-gray-500"
                onMouseEnter={() => {
                    setShow(true);
                }}
                onMouseLeave={() => {
                    setShow(false);
                }}
            />
            {show && (
                <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform rounded-lg bg-gray-900 px-3 py-2 text-xs whitespace-nowrap text-white">
                    {text}
                </div>
            )}
        </div>
    );
}

const DEFAULT_PREFERENCE_GROUP: PreferenceGroupCreate = {
    name: "",
    description: "",
    is_default: false,

    // Battery settings
    battery_charge_min_pct: 90,
    battery_max_temperature: 40,
    run_on_batteries: false,

    // Activity settings
    run_if_user_active: true,
    run_gpu_if_user_active: false,
    suspend_if_no_recent_input: 0,
    idle_time_to_run: 3,

    // Time restrictions
    start_hour: 0,
    end_hour: 0,
    net_start_hour: 0,
    net_end_hour: 0,

    // Memory and processing settings
    leave_apps_in_memory: false,
    max_ncpus_pct: 0,
    niu_max_ncpus_pct: 100,
    cpu_usage_limit: 100,
    niu_cpu_usage_limit: 100,
    suspend_cpu_usage: 25,
    niu_suspend_cpu_usage: 50,
    cpu_scheduling_period_minutes: 60,
    max_cpus: 0,

    // Work buffer settings
    work_buf_min_days: 0.1,
    work_buf_additional_days: 0.5,

    // Disk usage settings
    disk_interval: 60,
    disk_max_used_gb: 0,
    disk_max_used_pct: 90,
    disk_min_free_gb: 0.1,

    // Memory usage settings
    vm_max_used_pct: 75,
    ram_max_used_busy_pct: 50,
    ram_max_used_idle_pct: 90,

    // Network settings
    confirm_before_connecting: true,
    hangup_if_dialed: false,
    max_bytes_sec_up: 0,
    max_bytes_sec_down: 0,
    daily_xfer_limit_mb: 0,
    daily_xfer_period_days: 0,
    network_wifi_only: false,

    // Other settings
    dont_verify_images: false,
};

export default function PreferenceGroupEditPage({ isNew = false }: { isNew?: boolean }) {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();

    // Queries and mutations
    const {
        data: preferenceGroup,
        isLoading,
        error,
    } = usePreferenceGroupQuery(groupId ?? "", {
        enabled: !isNew && !!groupId,
    });

    const createMutation = useCreatePreferenceGroupMutation();
    const updateMutation = useUpdatePreferenceGroupMutation();

    // Form state
    const [formData, setFormData] = useState(DEFAULT_PREFERENCE_GROUP);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Set page title
    usePageTitle(isNew ? "Create Preference Group" : `Edit ${preferenceGroup?.name ?? "Preference Group"}`);

    // Load preference group data when available
    useEffect(() => {
        if (preferenceGroup && !isNew) {
            setFormData(preferenceGroup);
        }
    }, [preferenceGroup, isNew]);

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : type === "number" ? parseFloat(value) || 0 : value,
        });

        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        // Battery validation
        if (formData.battery_charge_min_pct < 0 || formData.battery_charge_min_pct > 100) {
            newErrors.battery_charge_min_pct = "Must be between 0 and 100";
        }

        // Time validation
        if (formData.start_hour < 0 || formData.start_hour >= 24) {
            newErrors.start_hour = "Must be between 0 and 23";
        }
        if (formData.end_hour < 0 || formData.end_hour >= 24) {
            newErrors.end_hour = "Must be between 0 and 23";
        }
        if (formData.net_start_hour < 0 || formData.net_start_hour >= 24) {
            newErrors.net_start_hour = "Must be between 0 and 23";
        }
        if (formData.net_end_hour < 0 || formData.net_end_hour >= 24) {
            newErrors.net_end_hour = "Must be between 0 and 23";
        }

        // CPU validation
        if (formData.cpu_usage_limit < 1 || formData.cpu_usage_limit > 100) {
            newErrors.cpu_usage_limit = "Must be between 1 and 100";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            if (isNew) {
                await createMutation.mutateAsync(formData);
            } else if (groupId) {
                await updateMutation.mutateAsync({
                    preferenceGroupId: groupId,
                    preferenceGroupData: formData,
                });
            }

            await navigate("/preference-groups");
        } catch (err) {
            console.error("Failed to save preference group:", err);
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border-l-4 border-red-500 bg-red-50 p-4">
                <p className="text-sm text-red-700">{error.message}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isNew ? "Create Preference Group" : "Edit Preference Group"}
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Configure BOINC computing preferences that can be applied to multiple computers
                    </p>
                </div>
                <button
                    onClick={() => void navigate("/preference-groups")}
                    className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none"
                >
                    Cancel
                </button>
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    void handleSubmit();
                }}
                className="space-y-6"
            >
                {/* Basic Information */}
                <Section
                    title="Basic Information"
                    description="Name and description for this preference group"
                    defaultOpen
                    variant="important"
                >
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={`mt-1 block w-full rounded-md border ${
                                    errors.name ? "border-red-300" : "border-gray-300"
                                } p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm`}
                                placeholder="e.g., Gaming Computer, Work Laptop, Server"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                value={formData.description}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                placeholder="Optional description of this preference group"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="is_default"
                                name="is_default"
                                checked={formData.is_default}
                                onChange={handleInputChange}
                                className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="is_default" className="ml-2 cursor-pointer text-sm text-gray-700">
                                Set as default preference group
                                <InfoTooltip text="Default groups are automatically assigned to new computers" />
                            </label>
                        </div>
                    </div>
                </Section>

                {/* Activity Settings */}
                <Section title="Activity Settings" description="Control when and how BOINC computes">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="run_if_user_active"
                                    name="run_if_user_active"
                                    checked={formData.run_if_user_active}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <label
                                    htmlFor="run_if_user_active"
                                    className="ml-2 cursor-pointer text-sm text-gray-700"
                                >
                                    Compute while computer is in use
                                    <InfoTooltip text="Allow BOINC tgo run when you're actively using the computer" />
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="run_gpu_if_user_active"
                                    name="run_gpu_if_user_active"
                                    checked={formData.run_gpu_if_user_active}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <label htmlFor="run_gpu_if_user_active" className="ml-2 text-sm text-gray-700">
                                    Use GPU while computer is in use
                                    <InfoTooltip text="Allow BOINC to use the GPU when you're actively using the computer" />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="idle_time_to_run" className="block text-sm font-medium text-gray-700">
                                    Wait before starting computation
                                </label>
                                <NumericInput
                                    id="idle_time_to_run"
                                    name="idle_time_to_run"
                                    value={formData.idle_time_to_run}
                                    onChange={handleInputChange}
                                    min={0}
                                    suffix="minutes"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="suspend_if_no_recent_input"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Suspend when no mouse/keyboard input for
                                </label>
                                <NumericInput
                                    id="suspend_if_no_recent_input"
                                    name="suspend_if_no_recent_input"
                                    value={formData.suspend_if_no_recent_input}
                                    onChange={handleInputChange}
                                    min={0}
                                    zeroMeaning="Disabled"
                                    suffix="minutes"
                                />
                            </div>
                        </div>
                    </div>
                </Section>

                {/* CPU Usage */}
                <Section title="CPU Usage" description="Control how BOINC uses your processor">
                    <div className="space-y-6">
                        {/* Basic CPU Settings */}
                        <div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="cpu_usage_limit"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        CPU usage limit
                                    </label>
                                    <NumericInput
                                        id="cpu_usage_limit"
                                        name="cpu_usage_limit"
                                        value={formData.cpu_usage_limit}
                                        onChange={handleInputChange}
                                        min={1}
                                        max={100}
                                        suffix="% of CPU time"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="niu_cpu_usage_limit"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        CPU usage limit (computer not in use)
                                    </label>
                                    <NumericInput
                                        id="niu_cpu_usage_limit"
                                        name="niu_cpu_usage_limit"
                                        value={formData.niu_cpu_usage_limit}
                                        onChange={handleInputChange}
                                        min={1}
                                        max={100}
                                        suffix="%"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="max_ncpus_pct" className="block text-sm font-medium text-gray-700">
                                        CPU cores limit
                                    </label>
                                    <NumericInput
                                        id="max_ncpus_pct"
                                        name="max_ncpus_pct"
                                        value={formData.max_ncpus_pct}
                                        onChange={handleInputChange}
                                        min={0}
                                        max={100}
                                        zeroMeaning="Use all CPU cores"
                                        suffix="% of CPU cores"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="niu_max_ncpus_pct"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        CPU cores limit (computer not in use)
                                    </label>
                                    <NumericInput
                                        id="niu_max_ncpus_pct"
                                        name="niu_max_ncpus_pct"
                                        value={formData.niu_max_ncpus_pct}
                                        onChange={handleInputChange}
                                        min={0}
                                        max={100}
                                        suffix="%"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="suspend_cpu_usage"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Suspend when CPU usage above
                                    </label>
                                    <NumericInput
                                        id="suspend_cpu_usage"
                                        name="suspend_cpu_usage"
                                        value={formData.suspend_cpu_usage}
                                        onChange={handleInputChange}
                                        min={0}
                                        max={100}
                                        suffix="%"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="niu_suspend_cpu_usage"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Suspend when CPU usage above (computer not in use)
                                    </label>
                                    <NumericInput
                                        id="niu_suspend_cpu_usage"
                                        name="niu_suspend_cpu_usage"
                                        value={formData.niu_suspend_cpu_usage}
                                        onChange={handleInputChange}
                                        min={0}
                                        max={100}
                                        suffix="%"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="max_cpus" className="block text-sm font-medium text-gray-700">
                                        Use at most
                                    </label>
                                    <NumericInput
                                        id="max_cpus"
                                        name="max_cpus"
                                        value={formData.max_cpus}
                                        onChange={handleInputChange}
                                        min={0}
                                        zeroMeaning="No limit"
                                        suffix="CPU cores"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="cpu_scheduling_period_minutes"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Task switching interval
                                    </label>
                                    <NumericInput
                                        id="cpu_scheduling_period_minutes"
                                        name="cpu_scheduling_period_minutes"
                                        value={formData.cpu_scheduling_period_minutes}
                                        onChange={handleInputChange}
                                        min={1}
                                        suffix="minutes"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Time Restrictions */}
                <Section
                    title="Time Restrictions"
                    description="Set daily schedules for computation and network activity"
                >
                    <div className="space-y-6">
                        {/* Computation Time */}
                        <div>
                            <h4 className="mb-4 text-sm font-medium text-gray-900">Computation Schedule</h4>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label htmlFor="start_hour" className="block text-sm font-medium text-gray-700">
                                        Compute only between
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <NumericInput
                                            id="start_hour"
                                            name="start_hour"
                                            value={formData.start_hour}
                                            onChange={handleInputChange}
                                            min={0}
                                            max={23.999999}
                                            className="w-20"
                                        />
                                        <span className="text-gray-500">and</span>
                                        <NumericInput
                                            id="end_hour"
                                            name="end_hour"
                                            value={formData.end_hour}
                                            onChange={handleInputChange}
                                            min={0}
                                            max={23.999999}
                                            className="w-20"
                                        />
                                        <span className="text-sm text-gray-500">(24-hour format)</span>
                                    </div>
                                    {Number(formData.start_hour) === 0 && Number(formData.end_hour) === 0 && (
                                        <p className="mt-1 text-xs text-blue-600">
                                            No time restrictions (compute anytime)
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Network Time */}
                        <div>
                            <h4 className="mb-4 text-sm font-medium text-gray-900">Network Schedule</h4>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label htmlFor="net_start_hour" className="block text-sm font-medium text-gray-700">
                                        Transfer files only between
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <NumericInput
                                            id="net_start_hour"
                                            name="net_start_hour"
                                            value={formData.net_start_hour}
                                            onChange={handleInputChange}
                                            min={0}
                                            max={23.999999}
                                            className="w-20"
                                        />
                                        <span className="text-gray-500">and</span>
                                        <NumericInput
                                            id="net_end_hour"
                                            name="net_end_hour"
                                            value={formData.net_end_hour}
                                            onChange={handleInputChange}
                                            min={0}
                                            max={23.999999}
                                            className="w-20"
                                        />
                                        <span className="text-sm text-gray-500">(24-hour format)</span>
                                    </div>
                                    {Number(formData.net_start_hour) === 0 && Number(formData.net_end_hour) === 0 && (
                                        <p className="mt-1 text-xs text-blue-600">
                                            No time restrictions (transfer anytime)
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Memory Usage */}
                <Section title="Memory Usage" description="Control how BOINC uses RAM and virtual memory">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label htmlFor="ram_max_used_busy_pct" className="block text-sm font-medium text-gray-700">
                                When computer in use, use at most
                            </label>
                            <NumericInput
                                id="ram_max_used_busy_pct"
                                name="ram_max_used_busy_pct"
                                value={formData.ram_max_used_busy_pct}
                                onChange={handleInputChange}
                                min={1}
                                max={100}
                                suffix="% of memory"
                            />
                        </div>

                        <div>
                            <label htmlFor="ram_max_used_idle_pct" className="block text-sm font-medium text-gray-700">
                                When computer idle, use at most
                            </label>
                            <NumericInput
                                id="ram_max_used_idle_pct"
                                name="ram_max_used_idle_pct"
                                value={formData.ram_max_used_idle_pct}
                                onChange={handleInputChange}
                                min={1}
                                max={100}
                                suffix="% of memory"
                            />
                        </div>

                        <div>
                            <label htmlFor="vm_max_used_pct" className="block text-sm font-medium text-gray-700">
                                Virtual memory size limit
                                <InfoTooltip text="Limit how much virtual memory BOINC tasks can use" />
                            </label>
                            <NumericInput
                                id="vm_max_used_pct"
                                name="vm_max_used_pct"
                                value={formData.vm_max_used_pct}
                                onChange={handleInputChange}
                                min={1}
                                max={100}
                                suffix="% of available space"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="leave_apps_in_memory"
                                name="leave_apps_in_memory"
                                checked={formData.leave_apps_in_memory}
                                onChange={handleInputChange}
                                className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="leave_apps_in_memory" className="ml-2 cursor-pointer text-sm text-gray-700">
                                Leave applications in memory when suspended
                                <InfoTooltip text="Keep BOINC tasks in memory instead of swapping to disk when suspended" />
                            </label>
                        </div>
                    </div>
                </Section>

                {/* Disk Usage */}
                <Section title="Disk Usage" description="Manage how BOINC uses disk space">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label htmlFor="disk_max_used_gb" className="block text-sm font-medium text-gray-700">
                                Use at most
                            </label>
                            <NumericInput
                                id="disk_max_used_gb"
                                name="disk_max_used_gb"
                                value={formData.disk_max_used_gb}
                                onChange={handleInputChange}
                                min={0}
                                zeroMeaning="No limit"
                                suffix="GB disk space"
                            />
                        </div>

                        <div>
                            <label htmlFor="disk_min_free_gb" className="block text-sm font-medium text-gray-700">
                                Leave at least
                            </label>
                            <NumericInput
                                id="disk_min_free_gb"
                                name="disk_min_free_gb"
                                value={formData.disk_min_free_gb}
                                onChange={handleInputChange}
                                min={0}
                                suffix="GB free"
                            />
                        </div>

                        <div>
                            <label htmlFor="disk_max_used_pct" className="block text-sm font-medium text-gray-700">
                                Use at most
                            </label>
                            <NumericInput
                                id="disk_max_used_pct"
                                name="disk_max_used_pct"
                                value={formData.disk_max_used_pct}
                                onChange={handleInputChange}
                                min={1}
                                max={100}
                                suffix="% of disk"
                            />
                        </div>

                        <div>
                            <label htmlFor="disk_interval" className="block text-sm font-medium text-gray-700">
                                Check disk usage every
                                <InfoTooltip text="How often BOINC checks available disk space" />
                            </label>
                            <NumericInput
                                id="disk_interval"
                                name="disk_interval"
                                value={formData.disk_interval}
                                onChange={handleInputChange}
                                min={1}
                                suffix="seconds"
                            />
                        </div>
                    </div>
                </Section>

                {/* Work Buffer */}
                <Section title="Work Buffer" description="Control how much work to download in advance">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label htmlFor="work_buf_min_days" className="block text-sm font-medium text-gray-700">
                                Store at least
                            </label>
                            <NumericInput
                                id="work_buf_min_days"
                                name="work_buf_min_days"
                                value={formData.work_buf_min_days}
                                onChange={handleInputChange}
                                min={0}
                                suffix="days of work"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="work_buf_additional_days"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Store up to an additional
                            </label>
                            <NumericInput
                                id="work_buf_additional_days"
                                name="work_buf_additional_days"
                                value={formData.work_buf_additional_days}
                                onChange={handleInputChange}
                                min={0}
                                suffix="days of work"
                            />
                        </div>
                    </div>
                </Section>

                {/* Network Settings */}
                <Section title="Network Usage" description="Configure network usage and transfer limits">
                    <div className="space-y-6">
                        {/* Transfer Speed */}
                        <div>
                            <h4 className="mb-4 text-sm font-medium text-gray-900">Transfer Speed Limits</h4>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="max_bytes_sec_up"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Maximum upload rate
                                    </label>
                                    <NumericInput
                                        id="max_bytes_sec_up"
                                        name="max_bytes_sec_up"
                                        value={formData.max_bytes_sec_up}
                                        onChange={handleInputChange}
                                        min={0}
                                        zeroMeaning="No limit"
                                        suffix="B/sec"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="max_bytes_sec_down"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Maximum download rate
                                    </label>
                                    <NumericInput
                                        id="max_bytes_sec_down"
                                        name="max_bytes_sec_down"
                                        value={formData.max_bytes_sec_down}
                                        onChange={handleInputChange}
                                        min={0}
                                        zeroMeaning="No limit"
                                        suffix="B/sec"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Daily Transfer Limits */}
                        <div>
                            <h4 className="mb-4 text-sm font-medium text-gray-900">Daily Transfer Limits</h4>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="daily_xfer_limit_mb"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Transfer at most
                                    </label>
                                    <NumericInput
                                        id="daily_xfer_limit_mb"
                                        name="daily_xfer_limit_mb"
                                        value={formData.daily_xfer_limit_mb}
                                        onChange={handleInputChange}
                                        min={0}
                                        zeroMeaning="No limit"
                                        suffix="MB"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="daily_xfer_period_days"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Every
                                    </label>
                                    <NumericInput
                                        id="daily_xfer_period_days"
                                        name="daily_xfer_period_days"
                                        value={formData.daily_xfer_period_days}
                                        onChange={handleInputChange}
                                        min={0}
                                        zeroMeaning="No limit"
                                        suffix="days"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Network Options */}
                        <div>
                            <h4 className="mb-4 text-sm font-medium text-gray-900">Network Options</h4>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="confirm_before_connecting"
                                        name="confirm_before_connecting"
                                        checked={formData.confirm_before_connecting}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="confirm_before_connecting" className="ml-2 text-sm text-gray-700">
                                        Confirm before connecting to internet (modem, ISDN, VPN)
                                        <InfoTooltip text="Ask permission before BOINC connects to projects" />
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="hangup_if_dialed"
                                        name="hangup_if_dialed"
                                        checked={formData.hangup_if_dialed}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="hangup_if_dialed" className="ml-2 text-sm text-gray-700">
                                        Disconnect any BOINC-activated internet connection when done
                                        <InfoTooltip text="Hang up dial-up connection when transfer completes" />
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="network_wifi_only"
                                        name="network_wifi_only"
                                        checked={formData.network_wifi_only}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="network_wifi_only" className="ml-2 text-sm text-gray-700">
                                        Transfer files only when connected to WiFi
                                        <InfoTooltip text="Avoid using mobile data for file transfers" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Battery Settings */}
                <Section title="Battery Settings" description="Settings for laptops and mobile devices">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="run_on_batteries"
                                name="run_on_batteries"
                                checked={formData.run_on_batteries}
                                onChange={handleInputChange}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="run_on_batteries" className="ml-2 text-sm text-gray-700">
                                Compute on battery power
                                <InfoTooltip text="Allow BOINC to run when computer is running on battery" />
                            </label>
                        </div>

                        <div>
                            <label htmlFor="battery_charge_min_pct" className="block text-sm font-medium text-gray-700">
                                Compute on battery only when charge above
                            </label>
                            <NumericInput
                                id="battery_charge_min_pct"
                                name="battery_charge_min_pct"
                                value={formData.battery_charge_min_pct}
                                onChange={handleInputChange}
                                min={0}
                                max={100}
                                suffix="%"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="battery_max_temperature"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Suspend when battery temperature exceeds
                            </label>
                            <NumericInput
                                id="battery_max_temperature"
                                name="battery_max_temperature"
                                value={formData.battery_max_temperature}
                                onChange={handleInputChange}
                                min={0}
                                suffix="°C"
                            />
                        </div>
                    </div>
                </Section>

                {/* Advanced Settings */}
                <Section
                    title="Advanced Settings"
                    description="Additional settings for special use cases"
                    variant="advanced"
                >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="dont_verify_images"
                                name="dont_verify_images"
                                checked={formData.dont_verify_images}
                                onChange={handleInputChange}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="dont_verify_images" className="ml-2 text-sm text-gray-700">
                                Skip image file verification
                            </label>
                        </div>
                    </div>
                </Section>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
                    <button
                        type="button"
                        onClick={() => void navigate("/preference-groups")}
                        className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="cursor-pointer rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? "Saving..." : isNew ? "Create Group" : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
