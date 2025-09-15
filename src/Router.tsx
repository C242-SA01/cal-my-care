import { Route, Routes, Navigate, Outlet, BrowserRouter } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Screening from "./pages/Screening";
import Results from "./pages/Results";
import AuthConfirm from "./pages/AuthConfirm";
import { useAuth } from "./hooks/useAuth";
import NotFound from "./pages/NotFound";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import PatientLayout from "./layouts/PatientLayout";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import PatientManagement from "./components/admin/PatientManagement";
import PatientDetail from "./components/admin/PatientDetail";
import EducationManagement from "./components/admin/EducationManagement";
import ScreeningManagement from "./components/admin/ScreeningManagement";

// Patient Pages
import History from "./pages/History";
import Education from "./pages/Education";
import EducationDetail from "./pages/EducationDetail";
import Profile from "./pages/Profile";


// --- Layouts and Route Guards ---

/**
 * A layout for public routes, or for users who are not authenticated yet.
 */
const PublicLayout = () => <Outlet />;

/**
 * A route guard for authenticated users.
 * If the user is not authenticated, it redirects them to the /auth page.
 */
const AuthenticatedRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
};

/**
 * A route guard for admin/midwife users.
 * If the user is not an admin, it redirects them to the regular user dashboard.
 */
const AdminRouteGuard = () => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'midwife';
  return isAdmin ? <AdminLayout /> : <Navigate to="/dashboard" replace />;
};

/**
 * A route guard for regular patient users.
 * If the user is an admin, it redirects them to the admin dashboard.
 */
const PatientRouteGuard = () => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'midwife';
  return !isAdmin ? <PatientLayout /> : <Navigate to="/admin" replace />;
};


// --- Main App Router ---
const Router = () => {
  const { isProfileLoading } = useAuth();

  if (isProfileLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/confirm" element={<AuthConfirm />} />
        </Route>

        {/* Authenticated Routes */}
        <Route element={<AuthenticatedRoute />}>
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRouteGuard />}>
            <Route index element={<AdminDashboard />} />
            <Route path="patients" element={<PatientManagement />} />
            <Route path="patient/:id" element={<PatientDetail />} />
            <Route path="education" element={<EducationManagement />} />
            <Route path="results" element={<ScreeningManagement />} />
          </Route>

          {/* Regular User/Patient Routes */}
          <Route element={<PatientRouteGuard />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/screening" element={<Screening />} />
            <Route path="/results" element={<Results />} />
            <Route path="/history" element={<History />} />
            <Route path="/education" element={<Education />} />
            <Route path="/education/:id" element={<EducationDetail />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Fallback Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
