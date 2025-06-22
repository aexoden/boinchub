import { Outlet } from "react-router";

import { useAuth } from "../../contexts/AuthContext";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppLayout() {
    const { isAdmin } = useAuth();

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="flex">
                <Sidebar isAdmin={isAdmin()} />
                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
