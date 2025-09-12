import { Route, Routes, Navigate, Outlet, BrowserRouter } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Screening from "./pages/Screening";
import Results from "./pages/Results";
import AuthConfirm from "./pages/AuthConfirm";
import { useAuth } from "./hooks/useAuth";
import NotFound from "./pages/NotFound";
import AdminLayout from "./layouts/AdminLayout";
import BottomNavbar from "./components/BottomNavbar";

// Helper component for a generic protected route
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
};

// Layout for regular users (ibu hamil)
const UserLayout = () => (
  <div className="pb-20">
    <Outlet />
    <BottomNavbar />
  </div>
);

// Main App Router
const Router = () => {
  const { isAuthenticated, userProfile, isProfileLoading } = useAuth();

  // You should have a 'role' column in your 'profiles' table in Supabase.
  // e.g., 'admin' or 'user'.
  const userRole = userProfile?.role || 'user';

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
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/confirm" element={<AuthConfirm />} />

        {/* Authenticated Routes Logic */}
        {isAuthenticated ? (
            userRole === 'admin' ? (
              // Admin Routes
              <Route element={<AdminLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/patients" element={<div>Daftar Pasien</div>} />
                <Route path="/dashboard/results" element={<div>Hasil Skrining Semua Pasien</div>} />
                <Route path="/*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            ) : (
              // User (Ibu Hamil) Routes
              <Route element={<UserLayout />}>
                <Route path="/screening" element={<Screening />} />
                <Route path="/results" element={<Results />} />
                <Route path="/*" element={<Navigate to="/screening" replace />} />
              </Route>
            )
        ) : (
          // Redirect to auth if not authenticated and not on a public route
          <Route path="/*" element={<Navigate to="/auth" replace />} />
        )}

        {/* Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
