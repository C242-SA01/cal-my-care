import { Route, Routes, Navigate, Outlet, BrowserRouter, useLocation } from 'react-router-dom';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Screening from './pages/Screening';
import Results from './pages/Results';
import AuthConfirm from './pages/AuthConfirm';
import UpdatePassword from './pages/UpdatePassword';
import { useAuth } from './hooks/useAuth';
import NotFound from './pages/NotFound';
import { Loader2 } from 'lucide-react';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import PatientLayout from './layouts/PatientLayout';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import PatientManagement from './components/admin/PatientManagement';
import PatientDetail from './components/admin/PatientDetail';
import EducationManagement from './components/admin/EducationManagement';
import ScreeningManagement from './components/admin/ScreeningManagement';
import AdminUserManagementPage from './pages/AdminUserManagement';

// Patient Pages
import History from './pages/History';
import Education from './pages/Education';
import EducationDetail from './pages/EducationDetail';
import Profile from './pages/Profile';
import ChatPage from './pages/ChatPage';
import QuizList from './pages/QuizList';
import CalmyPage from './pages/CalmyPage'; // Import CalmyPage
import CalmyNoteForm from './pages/CalmyNoteForm'; // Import CalmyNoteForm

// E-Modul Pages
import EModulList from './pages/EModulList';
import EModuleDetail from './pages/EModuleDetail';
import PatientEModuleDetail from './pages/PatientEModuleDetail';
import EModulAdminList from './pages/admin/EModulAdminList';
import EModulAdminForm from './pages/admin/EModulAdminForm';

// --- Layouts and Route Guards ---

/**
 * A layout for public routes, or for users who are not authenticated yet.
 */
const PublicLayout = () => <Outlet />;

/**
 * Gate to ensure new patients complete their profile before accessing the app.
 */
const ProfileCompletionGate = ({ children }: { children: React.ReactNode }) => {
  const { userProfile, isProfileLoading, isProfileComplete, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isProfileLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg text-gray-600">Memuat data pengguna...</p>
      </div>
    );
  }

  const isPatient = userProfile?.role === 'patient';
  // Corrected Logic: Redirect ANY patient with an incomplete profile
  const needsToCompleteProfile = isAuthenticated && isPatient && !isProfileComplete;

  if (needsToCompleteProfile && location.pathname !== '/profile') {
    return <Navigate to="/profile" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

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
  return (
    <BrowserRouter>
      <ProfileCompletionGate>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/confirm" element={<AuthConfirm />} />
            <Route path="/update-password" element={<UpdatePassword />} />
          </Route>

          {/* Authenticated Routes */}
          <Route element={<AuthenticatedRoute />}>
            {/* The Profile page is accessible to all authenticated users 
                but is not part of a specific layout that might redirect away from it. */}
            <Route path="/profile" element={<Profile />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRouteGuard />}>
              <Route index element={<AdminDashboard />} />
              <Route path="patients" element={<PatientManagement />} />
              <Route path="patient/:id" element={<PatientDetail />} />
              <Route path="education" element={<EducationManagement />} />
              <Route path="results" element={<ScreeningManagement />} />
              <Route path="users" element={<AdminUserManagementPage />} />
              {/* E-Modul Admin Routes */}
              <Route path="emodules" element={<EModulAdminList />} />
              <Route path="emodules/new" element={<EModulAdminForm />} />
              <Route path="emodules/:id/edit" element={<EModulAdminForm />} />
            </Route>

            {/* Regular User/Patient Routes */}
            <Route element={<PatientRouteGuard />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/quiz" element={<QuizList />} />
              <Route path="/quiz/:trimester" element={<Screening />} />
              <Route path="/results" element={<Results />} />
              <Route path="/history" element={<History />} />
              <Route path="/education" element={<Education />} />
              <Route path="/education/:id" element={<EducationDetail />} />
              <Route path="/chatbot" element={<ChatPage />} /> {/* New Chatbot Route */}
              {/* Calmy Routes */}
              <Route path="/calmy" element={<CalmyPage />} />
              <Route path="/calmy/new" element={<CalmyNoteForm />} />
              <Route path="/calmy/:id/edit" element={<CalmyNoteForm />} />

              {/* E-Modul Patient Route */}
              <Route path="/emodules" element={<EModulList />} />
              <Route path="/emodules/:id" element={<PatientEModuleDetail />} />
            </Route>
          </Route>

          {/* Fallback Not Found Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ProfileCompletionGate>
    </BrowserRouter>
  );
};

export default Router;