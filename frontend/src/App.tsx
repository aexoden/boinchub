import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import AuthProvider from "./components/common/AuthProvider";
import ConfigProvider from "./components/common/ConfigProvider";
import { useAuth } from "./contexts/AuthContext";
import { useConfig } from "./contexts/ConfigContext";

// Layouts
import AppLayout from "./components/layout/AppLayout";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// User Pages
import DashboardPage from "./pages/user/DashboardPage";
import ComputersPage from "./pages/user/ComputersPage";
import ComputerDetailPage from "./pages/user/ComputerDetailPage";
import AttachmentDetailPage from "./pages/user/AttachmentDetailPage";
import SettingsPage from "./pages/user/SettingsPage";

// Admin Pages
import ProjectsPage from "./pages/admin/ProjectsPage";
import UsersPage from "./pages/admin/UsersPage";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                if (error instanceof Error && "status" in error) {
                    const status = error.status;

                    if (status === 401 || status === 403) {
                        return false;
                    }
                }

                return failureCount < 3;
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
        },
        mutations: {
            retry: false,
        },
    },
});

interface ProtectedRouteProps {
    element: React.ReactNode;
    requireAdmin?: boolean;
}

function ProtectedRoute({ element, requireAdmin = false }: ProtectedRouteProps) {
    const { user, loading, isAdmin } = useAuth();

    // Show loading indicator while auth state is being determined
    if (loading) {
        return <div>Loading...</div>;
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check role permissions if roles are specified
    if (requireAdmin && !isAdmin()) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{element}</>;
}

function AppRoutes() {
    const { config, loading } = useConfig();

    // Show loading indicator while config is being loaded
    if (loading || !config) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-primary-500"></div>
                    <p className="mt-4 text-gray-600">Loading application...</p>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route path="/" element={<AppLayout />}>
                {/* User Routes */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<ProtectedRoute element={<DashboardPage />} />} />
                <Route path="computers" element={<ProtectedRoute element={<ComputersPage />} />} />
                <Route path="computers/:computerId" element={<ProtectedRoute element={<ComputerDetailPage />} />} />
                <Route
                    path="attachments/:attachmentId"
                    element={<ProtectedRoute element={<AttachmentDetailPage />} />}
                />
                <Route path="settings" element={<ProtectedRoute element={<SettingsPage />} />} />

                {/* Admin Routes */}
                <Route path="admin/projects" element={<ProtectedRoute element={<ProjectsPage />} requireAdmin />} />
                <Route path="admin/users" element={<ProtectedRoute element={<UsersPage />} requireAdmin />} />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <ConfigProvider>
                    <AuthProvider>
                        <AppRoutes />
                    </AuthProvider>
                </ConfigProvider>
            </Router>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
