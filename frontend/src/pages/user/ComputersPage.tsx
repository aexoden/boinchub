import { Link } from "react-router";
import { useCurrentUserComputersQuery, useProjectsQuery, useComputerAttachmentsQuery } from "../../hooks/queries";
import { Computer } from "../../types";
import ResourceUsageDisplay from "../../components/common/ResourceUsageDisplay";
import AttachmentStatusDisplay from "../../components/common/AttachmentStatusDisplay";
import { useConfig } from "../../contexts/ConfigContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import { formatDate } from "../../util/date";

export default function ComputersPage() {
    const { config } = useConfig();

    // Queries
    const { data: computers = [], isLoading: computersLoading, error: computersError } = useCurrentUserComputersQuery();

    const { data: projects = [], isLoading: projectsLoading } = useProjectsQuery(true);

    const projectsMap = projects.reduce<Record<string, string>>((acc, project) => {
        acc[project.id] = project.name;
        return acc;
    }, {});

    usePageTitle("My Computers");

    // Loading state
    const isLoading = computersLoading || projectsLoading;

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
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">My Computers</h1>
                <p className="mt-1 text-gray-600">View and manage your BOINC computers and their project attachments</p>
            </div>

            {isLoading ? (
                <div className="py-10 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                    <p className="mt-2 text-gray-700">Loading your computers...</p>
                </div>
            ) : computers.length === 0 ? (
                <div className="rounded-lg bg-white p-6 text-center shadow">
                    <p className="mb-4 text-gray-700">You don't have any computers registered yet.</p>
                    <p className="text-gray-600">
                        To use {config?.account_manager_name ?? "BoincHub"}, set up the BOINC client on your computer
                        and connect to this account manager using the provided URL.
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {computers.map((computer) => (
                        <ComputerCard key={computer.id} computer={computer} projectsMap={projectsMap} />
                    ))}
                </div>
            )}
        </div>
    );
}

interface ComputerCardProps {
    computer: Computer;
    projectsMap: Record<string, string>;
}

function ComputerCard({ computer, projectsMap }: ComputerCardProps) {
    const { data: attachments = [], isLoading: attachmentsLoading } = useComputerAttachmentsQuery(computer.id);

    return (
        <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="flex items-center justify-between bg-primary-700 px-6 py-4 text-white">
                <h2 className="text-xl font-semibold">{computer.hostname}</h2>
                <Link
                    to={`/computers/${computer.id}`}
                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
                >
                    View Details
                </Link>
            </div>

            <div className="p-6">
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <h3 className="mb-1 text-sm font-medium text-gray-500">CPID</h3>
                        <p className="font-mono text-gray-900">{computer.cpid}</p>
                    </div>
                    <div>
                        <h3 className="mb-1 text-sm font-medium text-gray-500">Last Connection</h3>
                        <p className="text-gray-900">{formatDate(computer.updated_at)}</p>
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="mb-3 text-lg font-medium text-gray-900">Attached Projects</h3>

                    {attachmentsLoading ? (
                        <div className="py-4 text-center">
                            <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
                            <span className="ml-2 text-sm text-gray-600">Loading attachments...</span>
                        </div>
                    ) : attachments.length === 0 ? (
                        <div className="py-4 text-center text-gray-500">
                            <p>No projects attached to this computer.</p>
                            <Link
                                to={`/computers/${computer.id}`}
                                className="mt-2 inline-block text-primary-600 hover:text-primary-900"
                            >
                                Attach a project
                            </Link>
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
                                    {attachments.map((attachment) => {
                                        const projectName = projectsMap[attachment.project_id] || "Unknown Project";

                                        return (
                                            <tr key={attachment.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {projectName}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {attachment.resource_share}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <ResourceUsageDisplay attachment={attachment} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <AttachmentStatusDisplay attachment={attachment} />
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                                    <Link
                                                        to={`/attachments/${attachment.id}`}
                                                        className="text-primary-600 hover:text-primary-900"
                                                    >
                                                        Edit
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
