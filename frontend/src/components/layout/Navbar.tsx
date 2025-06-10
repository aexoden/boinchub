import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { useConfig } from "../../contexts/ConfigContext";

export default function Navbar() {
    const { user, logout } = useAuth();
    const { config } = useConfig();

    return (
        <nav className="bg-primary-700 text-white shadow-md">
            <div className="mx-auto px-4">
                <div className="flex h-16 justify-between">
                    <div className="flex items-center">
                        <Link to="/" className="flex flex-shrink-0 items-center">
                            <span className="text-xl font-bold">{config?.account_manager_name ?? "BoincHub"}</span>
                        </Link>
                    </div>

                    {user && (
                        <div className="flex items-center">
                            <span className="mr-4">Welcome, {user.username}</span>
                            <div className="relative ml-3">
                                <div>
                                    <button
                                        type="button"
                                        className="rounded-md bg-primary-600 p-2 hover:bg-primary-800"
                                        onClick={logout}
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
