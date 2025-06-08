import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Computer, Project, ProjectAttachment, ProjectAttachmentCreate } from "../../types";
import { computerService } from "../../services/computer-service";
import { attachmentService } from "../../services/attachment-service";
import { projectService } from "../../services/project-service";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

export default function ComputerDetailPage() {
    const { computerId } = useParams<{ computerId: string }>();
    const navigate = useNavigate();

    const [computer, setComputer] = useState<Computer | null>(null);
    const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
    const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<string>("");
    const [account_key, setAccountKey] = useState("");
    const [resourceShare, setResourceShare] = useState("100");

    useEffect(() => {
        const fetchData = async () => {
            if (!computerId) {
                return;
            }

            try {
                // Fetch computer details
                const computerData = await computerService.getComputerById(computerId);
                setComputer(computerData);

                // Fetch computer's attachments
                const attachmentsData = await attachmentService.getComputerAttachments(computerId);
                setAttachments(attachmentsData);

                // Fetch all available projects
                const projectsData = await projectService.getAllProjects(true);

                // Filter out projects that are already attached
                const attachedProjectIds = attachmentsData.map((a) => a.project_id);
                const availableProjectsData = projectsData.filter((p) => !attachedProjectIds.includes(p.id));

                setAvailableProjects(availableProjectsData);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load computer details");
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, [computerId]);

    const handleAddAttachment = () => {
        setSelectedProject("");
        setAccountKey("");
        setResourceShare("100");
        setIsModalOpen(true);
    };

    const handleCreateAttachment = async () => {
        if (!selectedProject) {
            setError("Please select a project to attach.");
            return;
        }

        if (!account_key) {
            setError("Please enter a valid account key.");
            return;
        }

        if (!computer) {
            setError("Computer not found.");
            return;
        }

        try {
            const attachmentData: ProjectAttachmentCreate = {
                computer_id: computer.id,
                project_id: selectedProject,
                account_key,
                resource_share: Number(resourceShare),
            };
            const newAttachment = await attachmentService.createAttachment(attachmentData);

            // Update the attachments list
            setAttachments([...attachments, newAttachment]);

            // Remove the project from available projects
            setAvailableProjects(availableProjects.filter((p) => p.id !== selectedProject));

            // Close the modal
            setIsModalOpen(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to create attachment");
        }
    };

    const handleDeleteAttachment = async (attachmentId: string) => {
        if (!window.confirm("Are you sure you want to detach this project?")) {
            return;
        }

        try {
            await attachmentService.deleteAttachment(attachmentId);

            // Find the deleted attachment to get its project ID
            const deletedAttachment = attachments.find((a) => a.id === attachmentId);

            // Update attachments list
            setAttachments(attachments.filter((a) => a.id !== attachmentId));

            // If we deleted an attachment, add its project back to available projects
            if (deletedAttachment) {
                const project = await projectService.getProjectById(deletedAttachment.project_id);
                setAvailableProjects([...availableProjects, project]);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to detach project");
        }
    };

    // Format computer registration date
    const formatDate = (dateString: string) => {
        return new Date(Date.parse(dateString)).toLocaleString();
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
                            className="mt-2 text-sm font-medium text-yellow-700 hover:text-yellow-600"
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
                    className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
                >
                    Back to Computers
                </button>
            </div>

            {/* Computer Details */}
            <div className="mb-8 rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-medium text-gray-900">Computer Information</h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Domain Name</h3>
                        <p className="mt-1 text-gray-900">{computer.hostname}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">BOINC CPID</h3>
                        <p className="mt-1 font-mono text-gray-900">{computer.cpid}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">First Seen</h3>
                        <p className="mt-1 text-gray-900">{formatDate(computer.created_at)}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Last Connection</h3>
                        <p className="mt-1 text-gray-900">{formatDate(computer.updated_at)}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">BoincHub ID</h3>
                        <p className="mt-1 font-mono text-gray-900">{computer.id}</p>
                    </div>
                </div>
            </div>

            {/* Attached Projects */}
            <div className="rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Attached Projects</h2>
                    <button
                        onClick={handleAddAttachment}
                        disabled={availableProjects.length === 0}
                        className={`rounded-md px-4 py-2 text-white ${
                            availableProjects.length > 0
                                ? "hover:bg-primary700 bg-primary-600"
                                : "cursor-not-allowed bg-gray-400"
                        }`}
                    >
                        Attach Project
                    </button>
                </div>

                {attachments.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                        <p>No projects are attached to this computer.</p>
                        {availableProjects.length > 0 && (
                            <p className="mt-2">Click the "Attach Project" button to add a project.</p>
                        )}
                    </div>
                ) : (
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
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {attachments.map((attachment) => {
                                    const project = availableProjects.find((p) => p.id === attachment.project_id);

                                    return (
                                        <tr key={attachment.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {project
                                                        ? project.name
                                                        : `Project ID: ${attachment.project_id.toString()}`}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{attachment.resource_share}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {attachment.suspended ? (
                                                    <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs leading-5 font-semibold text-yellow-800">
                                                        Suspended
                                                    </span>
                                                ) : attachment.dont_request_more_work ? (
                                                    <span className="inline-flex rounded-full bg-orange-100 px-2 text-xs leading-5 font-semibold text-orange-800">
                                                        No New Work
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex rounded-full bg-green-100 px-2 text-xs leading-5 font-semibold text-green-800">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                                <button
                                                    onClick={() => {
                                                        void handleDeleteAttachment(attachment.id);
                                                    }}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Detach
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
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
                                        setSelectedProject(e.target.value);
                                    }}
                                    className="required mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value="">Select a project</option>
                                    {availableProjects.map((project) => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="authenticator" className="block text-sm font-medium text-gray-700">
                                    Authenticator Key
                                </label>
                                <input
                                    type="text"
                                    id="authenticator"
                                    value={account_key}
                                    onChange={(e) => {
                                        setAccountKey(e.target.value);
                                    }}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    required
                                    placeholder="Enter project authenticator key"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    You can obtain this from the project website. You should be able to use either your
                                    account key or your weak account key.
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
                                    value={resourceShare}
                                    onChange={(e) => {
                                        setResourceShare(e.target.value);
                                    }}
                                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                />
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
                                    className="rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none"
                                >
                                    Attach Project
                                </button>
                            </div>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
}
