import { Link } from "react-router";
import { useCurrentUserComputersQuery, useProjectsQuery, useComputerAttachmentsQuery } from "../../hooks/queries";
import { Computer } from "../../types";
import { useConfig } from "../../contexts/ConfigContext";

export default function ComputersPage() {
    const { config } = useConfig();

    // Queries
    const { data: computers = [], isLoading: computersLoading, error: computersError } = useCurrentUserComputersQuery();

    const { data: projects = [], isLoading: projectsLoading } = useProjectsQuery(true);

    const projectNamesMap = projects.reduce<Record<string, string>>((acc, project) => {
        acc[project.id] = project.name;
        return acc;
    }, {});

    // Format computer registration date
    const formatDate = (dateString: string) => {
        const date = new Date(Date.parse(dateString));

        // Format: YYYY-MM-DD HH:mm:ss
        const formatted_date = date.toISOString().replace("T", " ").substring(0, 19);

        // Get the timezone abbreviation
        const timeZone =
            Intl.DateTimeFormat("en", {
                timeZoneName: "short",
            })
                .formatToParts(date)
                .find((part) => part.type === "timeZoneName")?.value ?? "";

        return `${formatted_date} ${timeZone}`;
    };

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
                        <ComputerCard
                            key={computer.id}
                            computer={computer}
                            projectNamesMap={projectNamesMap}
                            formatDate={formatDate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface ComputerCardProps {
    computer: Computer;
    projectNamesMap: Record<string, string>;
    formatDate: (dateString: string) => string;
}

function ComputerCard({ computer, projectNamesMap, formatDate }: ComputerCardProps) {
    const { data: attachments = [], isLoading: attachmentsLoading } = useComputerAttachmentsQuery(computer.id);

    return (
        <div key={computer.id} className="overflow-hidden rounded-lg bg-white shadow">
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
                        <p className="text-gray-500">No projects attached to this computer.</p>
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
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {attachments.map((attachment) => (
                                        <tr key={attachment.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {projectNamesMap[attachment.project_id] || "Unknown Project"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{attachment.resource_share}</td>
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
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    to={`/attachments/${attachment.id}`}
                                                    className="mr-4 text-primary-600 hover:text-primary-900"
                                                >
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
