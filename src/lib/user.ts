import { supabase } from '@/integrations/supabase/client';

/**
 * Sets the is_first_login flag to false for the currently authenticated user.
 * If the Supabase update fails, it sets a fallback in localStorage.
 */
export const markFirstLoginAsCompleted = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated.");
    }

    const { error } = await supabase
      .from('profiles')
      .update({ is_first_login: false })
      .eq('id', user.id);

    if (error) {
      throw error;
    }
    // Also clear the fallback in case it was set before
    window.localStorage.removeItem('first_login_completed_fallback');

  } catch (error) {
    console.error("Failed to update is_first_login in Supabase:", error);
    // Set a fallback in localStorage to prevent blocking the user
    window.localStorage.setItem('first_login_completed_fallback', 'true');
  }
};
