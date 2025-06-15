import { NavLink } from "react-router";
import { HomeIcon, ServerIcon, UsersIcon, CogIcon, AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";

interface SidebarProps {
    isAdmin: boolean;
}

export default function Sidebar({ isAdmin }: SidebarProps) {
    return (
        <div className="min-h-[calc(100vh-4rem)] w-64 bg-white shadow-md">
            <div className="px-4 pt-5 pb-6">
                <nav className="flex-1 space-y-2">
                    {/* User Links */}
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            `flex items-center rounded-md px-3 py-3 text-gray-700 ${
                                isActive ? "bg-primary-100 text-primary-700" : "hover:bg-gray-100"
                            }`
                        }
                    >
                        <HomeIcon className="mr-3 h-5 w-5" />
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/computers"
                        className={({ isActive }) =>
                            `flex items-center rounded-md px-3 py-3 text-gray-700 ${
                                isActive ? "bg-primary-100 text-primary-700" : "hover:bg-gray-100"
                            }`
                        }
                    >
                        <ServerIcon className="mr-3 h-5 w-5" />
                        My Computers
                    </NavLink>

                    <NavLink
                        to="/preference-groups"
                        className={({ isActive }) =>
                            `flex items-center rounded-md px-3 py-3 text-gray-700 ${
                                isActive ? "bg-primary-100 text-primary-700" : "hover:bg-gray-100"
                            }`
                        }
                    >
                        <AdjustmentsHorizontalIcon className="mr-3 h-5 w-5" />
                        Preference Groups
                    </NavLink>

                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            `flex items-center rounded-md px-3 py-3 text-gray-700 ${
                                isActive ? "bg-primary-100 text-primary-700" : "hover:bg-gray-100"
                            }`
                        }
                    >
                        <CogIcon className="mr-3 h-5 w-5" />
                        Settings
                    </NavLink>

                    {/* Admin Links */}
                    {isAdmin && (
                        <>
                            <div className="mt-5 border-t border-gray-200 pt-5">
                                <p className="px-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                    Administration
                                </p>
                            </div>

                            <NavLink
                                to="/admin/projects"
                                className={({ isActive }) =>
                                    `flex items-center rounded-md px-3 py-3 text-gray-700 ${
                                        isActive ? "bg-primary-100 text-primary-700" : "hover:bg-gray-100"
                                    }`
                                }
                            >
                                <ServerIcon className="mr-3 h-5 w-5" />
                                Projects
                            </NavLink>

                            <NavLink
                                to="/admin/users"
                                className={({ isActive }) =>
                                    `flex items-center rounded-md px-3 py-3 text-gray-700 ${
                                        isActive ? "bg-primary-100 text-primary-700" : "hover:bg-gray-100"
                                    }`
                                }
                            >
                                <UsersIcon className="mr-3 h-5 w-5" />
                                Users
                            </NavLink>
                        </>
                    )}
                </nav>
            </div>
        </div>
    );
}
