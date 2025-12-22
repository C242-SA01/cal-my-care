import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * A route guard hook to enforce first-time screening completion.
 *
 * It checks if a 'patient' user is on their first login (is_first_login === true)
 * and redirects them to the '/screening' page if they try to access any other protected route.
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
    const isFirstLogin = userProfile.is_first_login;

    // If it's the first login for a patient and they are not on the screening page,
    // redirect them.
    if (isPatient && isFirstLogin && location.pathname !== '/screening' && location.pathname !== '/profile') {
      navigate('/screening', { replace: true });
    }
  }, [userProfile, isProfileLoading, navigate, location.pathname]);
};
