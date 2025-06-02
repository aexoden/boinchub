import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import AuthProvider from "./components/common/AuthProvider";
import { useAuth } from "./contexts/AuthContext";

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

interface ProtectedRouteProps {
    element: React.ReactNode;
    allowedRoles?: string[];
}

function ProtectedRoute({ element, allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();

    // Show loading indicator while auth state is being determined
    if (loading) {
        return <div>Loading...</div>;
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check role permissions if roles are specified
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{element}</>;
}

function AppRoutes() {
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
                <Route
                    path="admin/projects"
                    element={<ProtectedRoute element={<ProjectsPage />} allowedRoles={["admin"]} />}
                />
                <Route
                    path="admin/users"
                    element={<ProtectedRoute element={<UsersPage />} allowedRoles={["admin"]} />}
                />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}
