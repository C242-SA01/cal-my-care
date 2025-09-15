import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Define the structure of our user profile
interface UserProfile {
  id: string;
  role: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  isProfileLoading: boolean;
  signOut: () => Promise<void>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: AuthError | null }>;
  isAuthenticated: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setAuthLoading] = useState(true);
  const [isProfileLoading, setProfileLoading] = useState(true);

  const fetchProfile = useCallback(async (currentUser: User) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;

      setUserProfile(data as UserProfile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    setAuthLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser);
      } else {
        setProfileLoading(false);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser);
      } else {
        setUserProfile(null);
        setProfileLoading(false);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
  };

  const refreshUserProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const value = {
    user,
    userProfile,
    session,
    isProfileLoading: isAuthLoading || isProfileLoading,
    signOut,
    signIn,
    signUp,
    isAuthenticated: !!user,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};