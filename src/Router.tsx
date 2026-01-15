import { Route, Routes, Navigate, Outlet, BrowserRouter, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useOnboardingStatus } from './hooks/useOnboardingStatus';
import SplashScreen from './components/SplashScreen';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import PatientLayout from './layouts/PatientLayout';

// Core Pages
import Index from './pages/Index';
import Auth from './pages/Auth';
import AuthConfirm from './pages/AuthConfirm';
import UpdatePassword from './pages/UpdatePassword';
import NotFound from './pages/NotFound';

// Onboarding Pages
import OnboardingProfile from './pages/OnboardingProfile';
import PretestPass from './pages/PretestPass';

// Patient Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import QuizList from './pages/QuizList';
import Screening from './pages/Screening';
import Results from './pages/Results';
import CarePage from './pages/CarePage';
import Education from './pages/Education';
import EducationDetail from './pages/EducationDetail';
import ChatPage from './pages/ChatPage';
import CalmyPage from './pages/CalmyPage';
import CalmyNoteForm from './pages/CalmyNoteForm';
import EModulList from './pages/EModulList';
import PatientEModuleDetail from './pages/PatientEModuleDetail';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUserManagement from './pages/AdminUserManagement';
import PatientManagement from './components/admin/PatientManagement';
import EducationManagement from './components/admin/EducationManagement';
import ScreeningManagement from './components/admin/ScreeningManagement';
import EModulAdminForm from './pages/admin/EModulAdminForm';

// --- Route Guards & Gates ---

// 1. Checks if a user is logged in.
const AuthenticatedRoute = () => {
  const { isAuthenticated, isProfileLoading } = useAuth();
  if (isProfileLoading) return <SplashScreen />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
};

// 2. Checks if the logged-in user has a 'patient' role.
const PatientRoute = () => {
  const { userProfile, isProfileLoading } = useAuth();
  if (isProfileLoading) return <SplashScreen />;
  const isPatient = userProfile?.role === 'patient';
  return isPatient ? <Outlet /> : <Navigate to="/admin" replace />;
};

// 3. Checks if the logged-in user has an 'admin' or 'midwife' role.
const AdminRoute = () => {
  const { userProfile, isProfileLoading } = useAuth();
  if (isProfileLoading) return <SplashScreen />;
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'midwife';
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

// 4. The Onboarding Gate for Patients
const OnboardingGate = () => {
  const { status, isLoading } = useOnboardingStatus();
  const location = useLocation();

  if (isLoading) return <SplashScreen />;

  // Step 1: Profile Completion
  if (!status.isProfileComplete) {
    return location.pathname === '/lengkapi-profil' ? <Outlet /> : <Navigate to="/lengkapi-profil" replace />;
  }
  // Step 2: Pre-test Completion
  if (!status.isPretestComplete) {
    return location.pathname === '/pretest-pass' ? <Outlet /> : <Navigate to="/pretest-pass" replace />;
  }
  
  // If onboarding is complete but user tries to access onboarding pages, redirect them.
  if (location.pathname === '/lengkapi-profil' || location.pathname === '/pretest-pass') {
      return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />; // Onboarding is complete, proceed to the main app.
};


// --- Main App Router ---
const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* === PUBLIC ROUTES === */}
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/confirm" element={<AuthConfirm />} />
        <Route path="/update-password" element={<UpdatePassword />} />

        {/* === AUTHENTICATED ROUTES === */}
        <Route element={<AuthenticatedRoute />}>

          {/* --- PATIENT AREA --- */}
          <Route element={<PatientRoute />}>
            {/* Onboarding pages are inside PatientRoute but outside the Gate */}
            <Route path="/lengkapi-profil" element={<OnboardingProfile />} />
            <Route path="/pretest-pass" element={<PretestPass />} />
            
            <Route element={<OnboardingGate />}>
              <Route element={<PatientLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/quiz" element={<QuizList />} />
                <Route path="/quiz/:quizType" element={<Screening />} />
                <Route path="/results" element={<Results />} />
                <Route path="/history" element={<CarePage />} />
                <Route path="/education" element={<Education />} />
                <Route path="/education/:id" element={<EducationDetail />} />
                <Route path="/chatbot" element={<ChatPage />} />
                <Route path="/calmy" element={<CalmyPage />} />
                <Route path="/calmy/new" element={<CalmyNoteForm />} />
                <Route path="/calmy/:id/edit" element={<CalmyNoteForm />} />
                <Route path="/emodules" element={<EModulList />} />
                <Route path="/emodules/:id" element={<PatientEModuleDetail />} />
              </Route>
            </Route>
          </Route>

          {/* --- ADMIN AREA --- */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUserManagement />} />
                <Route path="/admin/emodules" element={<EModulList />} />
                <Route path="/admin/emodules/new" element={<EModulAdminForm />} />
                <Route path="/admin/emodules/:id/edit" element={<EModulAdminForm />} />
                <Route path="/admin/patients" element={<PatientManagement />} />
                <Route path="/admin/education" element={<EducationManagement />} />
                <Route path="/admin/results" element={<ScreeningManagement />} />
                <Route path="/admin/profile" element={<Profile />} />
            </Route>
          </Route>

        </Route>

        {/* === FALLBACK ROUTE === */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;