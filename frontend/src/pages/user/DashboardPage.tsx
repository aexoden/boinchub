import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { useConfig } from "../../contexts/ConfigContext";
import { Computer } from "../../types";
import { computerService } from "../../services/computer-service";

export default function DashboardPage() {
    const { user } = useAuth();
    const { config } = useConfig();
    const [computers, setComputers] = useState<Computer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchComputers = async () => {
            try {
                const data = await computerService.getUserComputers();
                setComputers(data);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load computers";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        void fetchComputers();
    }, []);

    return (
        <div>
            <div>
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="mt-1 text-gray-600">
                        Welcome to {config?.account_manager_name ?? "BoincHub"}, {user?.username}!
                    </p>
                </div>

                <div className="mb-6 rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-lg font-medium text-gray-900">Your BOINC Computers</h2>

                    {loading ? (
                        <p>Loading computers...</p>
                    ) : error ? (
                        <div className="text-red-500">{error}</div>
                    ) : computers.length === 0 ? (
                        <div className="text-gray-500">
                            <p>You don't have any computers registered to your account.</p>
                            <p className="mt-2">
                                To use {config?.account_manager_name ?? "BoincHub"}, set up the BOINC client on your
                                computer and connect to this account manager using the following URL:
                            </p>
                            <div className="mt-2 rounded-md bg-gray-100 p-3 font-mono">
                                {config?.boinc_url ?? "Loading..."}
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Computer Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            CPID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Last Seen
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {computers.map((computer) => (
                                        <tr key={computer.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{computer.hostname}</td>
                                            <td className="px-6 py-4 font-mono text-sm whitespace-nowrap">
                                                {computer.cpid.substring(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(Date.parse(computer.updated_at)).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    to={`/computers/${computer.id.toString()}`}
                                                    className="text-primary-600 hover:text-primary-900"
                                                >
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                    <h2 className="mb-4 text-lg font-medium text-gray-900">BOINC Account Manager Information</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="space-y-3">
                                <p className="mt-2">
                                    To use {config?.account_manager_name ?? "BoincHub"}, set up the BOINC client on your
                                    computer and connect to this account manager using the following URL:
                                </p>
                                <div className="mt-2 rounded-md bg-gray-100 p-3 font-mono">
                                    {config?.boinc_url ?? "Loading..."}
                                </div>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
