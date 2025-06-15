import { ProjectAttachment } from "../../types";

interface ResourceUsageDisplayProps {
    attachment: ProjectAttachment;
}

export default function ResourceUsageDisplay({ attachment }: ResourceUsageDisplayProps) {
    const resources = [
        {
            name: "CPU",
            enabled: !attachment.no_cpu,
            className: "bg-blue-100 text-blue-800",
        },
        {
            name: "NVIDIA",
            enabled: !attachment.no_gpu_nvidia,
            className: "bg-green-100 text-green-800",
        },
        {
            name: "AMD",
            enabled: !attachment.no_gpu_amd,
            className: "bg-red-100 text-red-800",
        },
        {
            name: "Intel",
            enabled: !attachment.no_gpu_intel,
            className: "bg-purple-100 text-purple-800",
        },
    ];

    const enabledResources = resources.filter((r) => r.enabled);
    const disabledResources = resources.filter((r) => !r.enabled);

    return (
        <div className="text-sm">
            {enabledResources.length === 0 ? (
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    None Enabled
                </span>
            ) : (
                <div className="flex flex-wrap gap-1">
                    {enabledResources.map((resource) => (
                        <span
                            key={resource.name}
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${resource.className}`}
                        >
                            {resource.name}
                        </span>
                    ))}
                    {disabledResources.length > 0 && disabledResources.length < 4 && (
                        <span
                            className="text-xs text-gray-500"
                            title={`Disabled: ${disabledResources.map((r) => r.name).join(", ")}`}
                        >
                            ({disabledResources.length} disabled)
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
