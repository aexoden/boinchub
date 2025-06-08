import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ProjectAttachment, ProjectAttachmentUpdate, Project, Computer } from "../../types";
import { attachmentService } from "../../services/attachment-service";
import { projectService } from "../../services/project-service";
import { computerService } from "../../services/computer-service";

export default function AttachmentDetailPage() {
    const { attachmentId } = useParams<{ attachmentId: string }>();
    const navigate = useNavigate();

    const [attachment, setAttachment] = useState<ProjectAttachment | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [computer, setComputer] = useState<Computer | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    // Form state
    const [resourceShare, setResourceShare] = useState("");
    const [suspended, setSuspended] = useState(false);
    const [dontRequestMoreWork, setDontRequestMoreWork] = useState(false);
    const [detachWhenDone, setDetachWhenDone] = useState(false);
    const [noCpu, setNoCpu] = useState(false);
    const [noGpuNvidia, setNoGpuNvidia] = useState(false);
    const [noGpuAmd, setNoGpuAmd] = useState(false);
    const [noGpuIntel, setNoGpuIntel] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!attachmentId) {
                return;
            }

            try {
                // Fetch attachment details
                const attachmentData = await attachmentService.getAttachmentById(attachmentId);
                setAttachment(attachmentData);

                // Set form state
                setResourceShare(attachmentData.resource_share.toString());
                setSuspended(attachmentData.suspended);
                setDontRequestMoreWork(attachmentData.dont_request_more_work);
                setDetachWhenDone(attachmentData.detach_when_done);
                setNoCpu(attachmentData.no_cpu);
                setNoGpuNvidia(attachmentData.no_gpu_nvidia);
                setNoGpuAmd(attachmentData.no_gpu_amd);
                setNoGpuIntel(attachmentData.no_gpu_intel);

                // Fetch project and computer details
                const projectData = await projectService.getProjectById(attachmentData.project_id);
                const computerData = await computerService.getComputerById(attachmentData.computer_id);

                setProject(projectData);
                setComputer(computerData);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load attachment details");
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, [attachmentId]);

    const handleSubmit = async () => {
        if (!attachment) {
            return;
        }

        const updateData: ProjectAttachmentUpdate = {
            resource_share: parseInt(resourceShare),
            suspended,
            dont_request_more_work: dontRequestMoreWork,
            detach_when_done: detachWhenDone,
            no_cpu: noCpu,
            no_gpu_nvidia: noGpuNvidia,
            no_gpu_amd: noGpuAmd,
            no_gpu_intel: noGpuIntel,
        };

        try {
            const updatedAttachment = await attachmentService.updateAttachment(attachment.id, updateData);
            setAttachment(updatedAttachment);
            setMessage({ text: "Attachment updated successfully", type: "success" });

            // Scroll to the top to show the message
            window.scrollTo(0, 0);
        } catch (err: unknown) {
            setMessage({ text: err instanceof Error ? err.message : "Failed to update attachment", type: "error" });
        }
    };

    const handleDetach = async () => {
        if (!attachment || !computer) {
            return;
        }

        if (!window.confirm("Are you sure you want to detach this project?")) {
            return;
        }

        try {
            await attachmentService.deleteAttachment(attachment.id);
            await navigate(`/computers/${computer.id.toString()}`);
        } catch (err: unknown) {
            setMessage({ text: err instanceof Error ? err.message : "Failed to detach project", type: "error" });
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border-l-4 border-red-500 bg-red-50 p-4">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                        <button
                            onClick={() => void navigate("/computers")}
                            className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
                        >
                            Go back to computers
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!attachment || !project || !computer) {
        return (
            <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
                <div className="flex">
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">Attachment, project, or computer not found</p>
                        <button
                            onClick={() => void navigate("/Computers")}
                            className="mt-2 text-sm font-medium text-yellow-700 hover:text-yellow-600"
                        >
                            Go back to computers
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
                    <h1 className="text-2xl font-bold text-gray-900">Project Attachment Settings</h1>
                    <p className="mt-1 text-gray-600">
                        Manage settings for {project.name} on {computer.hostname}
                    </p>
                </div>
                <button
                    onClick={() => void navigate(`/computers/${computer.id.toString()}`)}
                    className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
                >
                    Back to Computer
                </button>
            </div>

            {/* Success/Error Message */}
            {message && (
                <div
                    className={`mb-6 rounded-md p-4 ${
                        message.type === "success"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-red-500 bg-red-50 text-red-700"
                    } border-l-4`}
                >
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Project Info */}
                <div className="lg:col-span-1">
                    <div className="rounded-lg bg-white p-6 shadow">
                        <h2 className="mb-4 text-lg font-medium text-gray-900">Project Information</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Project Name</h3>
                                <p className="mt-1 text-gray-900">{project.name}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">URL</h3>
                                <p className="mt-1 font-mono break-all text-gray-900">{project.url}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                                <p className="mt-1 text-gray-900">
                                    {project.description || "No description available"}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Computer</h3>
                                <p className="mt-1 text-gray-900">{computer.hostname}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Authenticator</h3>
                                <p className="mt-1 truncate font-mono text-sm text-gray-900">
                                    {attachment.account_key}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attachment Settings Form */}
                <div className="lg:col-span-2">
                    <div className="shadow-rounded-lg bg-white p-6">
                        <h2 className="mb-4 text-lg font-medium text-gray-900">Attachment Settings</h2>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                void handleSubmit();
                            }}
                        >
                            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* Resource Share */}
                                <div>
                                    <label
                                        htmlFor="resourceShare"
                                        className="mb-1 block text-sm font-medium text-gray-700"
                                    >
                                        Resource Share
                                    </label>
                                    <input
                                        type="text"
                                        id="resourceShare"
                                        value={resourceShare}
                                        onChange={(e) => {
                                            setResourceShare(e.target.value);
                                        }}
                                        className="block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Determines how much resource allocation this project gets relative to others
                                    </p>
                                </div>
                            </div>

                            <h3 className="text-md mb-3 font-medium text-gray-900">Computation Settings</h3>

                            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Suspend Project */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="suspended"
                                        checked={suspended}
                                        onChange={(e) => {
                                            setSuspended(e.target.checked);
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="suspended" className="ml-2 block text-sm text-gray-700">
                                        Suspend Project
                                    </label>
                                </div>

                                {/* Don't Request More Work */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="dontRequestMoreWork"
                                        checked={dontRequestMoreWork}
                                        onChange={(e) => {
                                            setDontRequestMoreWork(e.target.checked);
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="dontRequestMoreWork" className="ml-2 block text-sm text-gray-700">
                                        Don't Request More Work
                                    </label>
                                </div>

                                {/* Detach When Done */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="detachWhenDone"
                                        checked={detachWhenDone}
                                        onChange={(e) => {
                                            setDetachWhenDone(e.target.checked);
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="detachWhenDone" className="ml-2 block text-sm text-gray-700">
                                        Detach When Done
                                    </label>
                                </div>
                            </div>

                            <h3 className="text-md mb-3 font-medium text-gray-900">Resource Usage</h3>

                            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* No CPU */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="noCpu"
                                        checked={noCpu}
                                        onChange={(e) => {
                                            setNoCpu(e.target.checked);
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="noCpu" className="ml-2 block text-sm text-gray-700">
                                        Don't Use CPU
                                    </label>
                                </div>

                                {/* No NVIDIA GPU */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="noGpuNvidia"
                                        checked={noGpuNvidia}
                                        onChange={(e) => {
                                            setNoGpuNvidia(e.target.checked);
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="noGpuNvidia" className="ml-2 block text-sm text-gray-700">
                                        Don't Use NVIDIA GPU
                                    </label>
                                </div>

                                {/* No AMD GPU */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="noGpuAmd"
                                        checked={noGpuAmd}
                                        onChange={(e) => {
                                            setNoGpuAmd(e.target.checked);
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="noGpuAmd" className="ml-2 block text-sm text-gray-700">
                                        Don't Use AMD GPU
                                    </label>
                                </div>

                                {/* No Intel GPU */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="noGpuIntel"
                                        checked={noGpuIntel}
                                        onChange={(e) => {
                                            setNoGpuIntel(e.target.checked);
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor="noGpuIntel" className="ml-2 block text-sm text-gray-700">
                                        Don't Use Intel GPU
                                    </label>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => {
                                        void handleDetach();
                                    }}
                                    className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                                >
                                    Detach Project
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
