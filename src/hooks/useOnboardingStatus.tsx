import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface OnboardingStatus {
  isProfileComplete: boolean;
  isPretestComplete: boolean;
}

export const useOnboardingStatus = () => {
  // CORRECTED: Destructure userProfile and isProfileLoading as well.
  const { session, userProfile, isProfileLoading } = useAuth(); 
  const [status, setStatus] = useState<OnboardingStatus>({
    isProfileComplete: false,
    isPretestComplete: false,
  });
  // Use a local loading state that also considers the profile loading state.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      // If there's no user session, we can stop early.
      if (!session?.user) {
        setStatus({ isProfileComplete: false, isPretestComplete: false });
        setIsLoading(false);
        return;
      }
      
      // If the profile is still being loaded by useAuth, wait for it.
      if (isProfileLoading) {
        setIsLoading(true);
        return;
      }

      // We have a session and the profile is loaded, now fetch the specific onboarding status.
      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_user_onboarding_status');

      if (error) {
        console.error('Error fetching onboarding status:', error);
        // Default to a completed state on error to avoid blocking the user.
        setStatus({ isProfileComplete: true, isPretestComplete: true });
      } else if (data && data.length > 0) {
        const onboardingData = data[0];
        setStatus({
          isProfileComplete: onboardingData.is_profile_complete,
          isPretestComplete: onboardingData.is_pretest_pass_completed,
        });
      } else {
        // This case can happen if the RPC returns no rows for a valid user.
        // Safest default is to assume onboarding is not complete.
        setStatus({ isProfileComplete: false, isPretestComplete: false });
      }

      setIsLoading(false);
    };

    checkStatus();
  // CORRECTED: The dependency array now includes userProfile.
  // When refreshUserProfile() is called, userProfile changes, and this effect will re-run.
  }, [session, userProfile, isProfileLoading]);

  // Return the combined loading state
  return { status, isLoading: isLoading || isProfileLoading, session };
};
