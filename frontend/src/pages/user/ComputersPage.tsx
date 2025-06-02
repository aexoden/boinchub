import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Computer, ProjectAttachment } from "../../types";
import { computerService } from "../../services/computer-service";
import { attachmentService } from "../../services/attachment-service";
import { projectService } from "../../services/project-service";

export default function ComputersPage() {
    const [computers, setComputers] = useState<Computer[]>([]);
    const [computerAttachments, setComputerAttachments] = useState<Record<number, ProjectAttachment[]>>({});
    const [projectNames, setProjectNames] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get all computers
                const computersData = await computerService.getUserComputers();
                setComputers(computersData);

                // Get all projects for name mapping
                const projectsData = await projectService.getAllProjects(true);
                const projectNamesMap: Record<number, string> = {};
                projectsData.forEach((project) => {
                    projectNamesMap[project.id] = project.name;
                });
                setProjectNames(projectNamesMap);

                // Get attachments for each computer
                const attachmentsMap: Record<number, ProjectAttachment[]> = {};
                for (const computer of computersData) {
                    const attachments = await attachmentService.getComputerAttachments(computer.id);
                    attachmentsMap[computer.id] = attachments;
                }
                setComputerAttachments(attachmentsMap);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load computers";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, []);

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">My Computers</h1>
                <p className="mt-1 text-gray-600">View and manage your BOINC computers and their project attachments</p>
            </div>

            {loading ? (
                <div className="py-10 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                    <p className="mt-2 text-gray-700">Loading your computers...</p>
                </div>
            ) : error ? (
                <div className="gborder-red-500 mb-6 border-l-4 bg-red-50 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            ) : computers.length === 0 ? (
                <div className="rounded-lg bg-white p-6 text-center shadow">
                    <p className="mb-4 text-gray-700">You don't have any computers registered yet.</p>
                    <p className="text-gray-600">
                        To use BoincHub, set up the BOINC client on your computer and connect to this account manager
                        using the provided URL.
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {computers.map((computer) => (
                        <div key={computer.id} className="overflow-hidden rounded-lg bg-white shadow">
                            <div className="flex items-center justify-between bg-primary-700 px-6 py-4 text-white">
                                <h2 className="text-xl font-semibold">{computer.domain_name}</h2>
                                <Link
                                    to={`/computers/${computer.id.toString()}`}
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
                                        <p className="text-gray-900">
                                            {new Date(Date.parse(computer.updated_at)).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h3 className="mb-3 text-lg font-medium text-gray-900">Attached Projects</h3>

                                    {computerAttachments[computer.id].length ? (
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
                                                    {computerAttachments[computer.id].map((attachment) => (
                                                        <tr key={attachment.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {projectNames[attachment.project_id] ||
                                                                    "Unknown Project"}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {attachment.resource_share}
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
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <Link
                                                                    to={`/attachments/${attachment.id.toString()}`}
                                                                    className="hover:Text-primary-900 mr-4 text-primary-600"
                                                                >
                                                                    Edit
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No projects attached to this computer.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
