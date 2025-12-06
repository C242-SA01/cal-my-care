import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * A route guard hook to enforce first-time screening completion.
 *
 * It checks if a 'patient' user is on their first login and redirects them
 * to the '/screening' page if they try to access any other protected route.
 *
 * It also handles the edge case where the Supabase profile update failed
 * by checking a localStorage fallback.
 */
export const useFirstTimeGate = () => {
  const { userProfile, isProfileLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isProfileLoading || !userProfile) {
      return; // Wait for profile to load
    }

    const isPatient = userProfile.role === 'patient';
    // The profile might have the old value if the DB call was slow, so we also check the fallback
    const isFirstLogin = userProfile.is_first_login || window.localStorage.getItem('first_login_completed_fallback') === 'true';

    // If it's the first login for a patient and they are not on the screening page
    if (isPatient && isFirstLogin && location.pathname !== '/screening') {
      // Redirect them to the screening page
      navigate('/screening', { replace: true });
    }
  }, [userProfile, isProfileLoading, navigate, location.pathname]);
};
