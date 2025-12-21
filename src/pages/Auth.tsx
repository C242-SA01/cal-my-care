import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import React from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Loader2, Heart, Mail, Lock, User2, Phone, Calendar, GraduationCap, Briefcase, Eye, EyeOff, ChevronsUpDown } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import SplashScreen from '@/components/SplashScreen';
import { markFirstLoginAsCompleted } from '@/lib/user';

// ==========================================
// UI Helper
// ==========================================
function FieldIcon({ icon }: { icon: React.ReactNode }) {
  return <div className="absolute inset-y-0 left-3 flex items-center text-rose-400 pointer-events-none">{icon}</div>;
}

// ==========================================
// SIGN-IN FORM COMPONENT
// ==========================================
const signInSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid.' }),
  password: z.string().min(1, { message: 'Password tidak boleh kosong.' }),
});

interface SignInFormProps {
  setTab: (tab: 'signin' | 'signup') => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
}

const SignInForm = React.memo(({ setTab, setIsLoading, isLoading }: SignInFormProps) => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const mapAuthError = useCallback((message: string): string => {
    if (message.includes('Invalid login credentials')) return 'Email atau password salah.';
    return 'Terjadi kesalahan. Silakan coba lagi.';
  }, []);

  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(values.email, values.password);
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Gagal Masuk',
        description: mapAuthError(error.message),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw error;
    } catch (e: any) {
      toast({
        title: 'Gagal Masuk Google',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center">
        <h2 className="text-3xl font-bold">Selamat Datang ♥</h2>
        <p className="text-slate-600">Masuk ke akun CalmyCare Anda</p>
      </div>

      <Form {...signInForm}>
        <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-5 pt-6">
          <FormField
            control={signInForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <FieldIcon icon={<Mail size={18} />} />
                    <Input className="h-12 rounded-xl pl-10 shadow-sm" placeholder="Email" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={signInForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <FieldIcon icon={<Lock size={18} />} />
                    <Input type={showPassword ? 'text' : 'password'} placeholder="Password" className="h-12 rounded-xl pl-10 pr-10 shadow-sm" {...field} />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowPassword((s) => !s)}>
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-full bg-rose-400 text-white">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Masuk
          </Button>
          <Button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full h-12 rounded-full border shadow-sm">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="google logo" className="h-5 w-5 mr-3" />
            Masuk dengan Google
          </Button>
        </form>
      </Form>

      <p className="text-center pt-6">
        Belum punya akun?{' '}
        <button onClick={() => setTab('signup')} className="text-rose-500 font-semibold">
          Daftar sekarang
        </button>
      </p>
    </>
  );
});

// ==========================================
// SIGN-UP FORM COMPONENT
// ==========================================
const signUpSchema = z.object({
  fullName: z.string().min(3, { message: 'Nama lengkap minimal 3 karakter.' }),
  email: z.string().email({ message: 'Format email tidak valid.' }),
  password: z.string().min(8, { message: 'Password minimal 8 karakter.' }),
});
type SignUpValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  setTab: (tab: 'signin' | 'signup') => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
}

const SignUpForm = React.memo(({ setTab, setIsLoading, isLoading }: SignUpFormProps) => {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const mapAuthError = useCallback((message: string): string => {
    if (message.includes('User already registered')) return 'Email ini sudah terdaftar.';
    if (message.includes('Password should be at least 8 characters')) return 'Password minimal 8 karakter.';
    return 'Terjadi kesalahan. Silakan coba lagi.';
  }, []);

  const handleSignUp = async (values: SignUpValues) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(values.email, values.password, values.fullName);
      if (error) throw error;
      // localStorage.setItem('callmycare.pendingProfile', JSON.stringify(values)); //<- REMOVED
      toast({
        title: 'Pendaftaran Berhasil!',
        description: 'Silakan cek email untuk verifikasi.',
      });
      signUpForm.reset();
      setTab('signin');
    } catch (error: any) {
      toast({
        title: 'Pendaftaran Gagal',
        description: mapAuthError(error.message),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center">
        <h2 className="text-3xl font-bold">Buat Akun Baru</h2>
        <p className="text-slate-600">Isi data untuk mendaftar</p>
      </div>

      <Form {...signUpForm}>
        <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4 pt-6">
          <FormField
            control={signUpForm.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <FieldIcon icon={<User2 size={18} />} />
                    <Input placeholder="Nama Lengkap" className="h-12 rounded-xl pl-10 shadow-sm" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={signUpForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <FieldIcon icon={<Mail size={18} />} />
                    <Input placeholder="Email" className="h-12 rounded-xl pl-10 shadow-sm" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={signUpForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <FieldIcon icon={<Lock size={18} />} />
                    <Input type={showPassword ? 'text' : 'password'} placeholder="Password" className="h-12 rounded-xl pl-10 pr-10 shadow-sm" {...field} />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowPassword((s) => !s)}>
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full h-12 rounded-full bg-rose-400 text-white" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Daftar
          </Button>
        </form>
      </Form>

      <p className="text-center pt-6">
        Sudah punya akun?{' '}
        <button onClick={() => setTab('signin')} className="text-rose-500 font-semibold">
          Masuk
        </button>
      </p>
    </>
  );
});

// ==========================================
// MAIN AUTH COMPONENT
// ==========================================
export default function Auth() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const { user, userProfile, isProfileLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSplashFinished = async () => {
    if (!userProfile || !user) return;
    const { role, is_first_login } = userProfile;

    if (role === 'patient' && is_first_login) {
      // Redirect to the profile page to force completion.
      // The ProfileCompletionGate will handle the rest.
      navigate('/profile', { replace: true });

    } else if (role === 'admin' || role === 'midwife') {
      navigate('/admin', { replace: true });
    } else if (role === 'patient') {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  useEffect(() => {
    if (user && !isProfileLoading && userProfile) {
      setShowSplash(true);
    }
  }, [user, isProfileLoading, userProfile, navigate]);

  if (showSplash) return <SplashScreen onFinished={handleSplashFinished} />;

  if (isProfileLoading && !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-[#FAD2E1] to-[#FBE5EC]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-[#FAD2E1] via-[#FBE5EC] to-[#FAD2E1] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2.5 mb-2">
            <img src="/assets/logo-CalMyCare.png" alt="CalmyCare Logo" className="h-10 w-10" />
            <h1 className="text-3xl font-extrabold">CalmyCare</h1>
          </div>
          <p className="text-sm text-slate-600">Skrining kecemasan ibu hamil primigravida</p>
        </div>

        <div className="rounded-3xl shadow-xl bg-white/80 p-6">
          {tab === 'signin' ? (
            <SignInForm setTab={setTab} setIsLoading={setIsLoading} isLoading={isLoading} />
          ) : (
            <SignUpForm setTab={setTab} setIsLoading={setIsLoading} isLoading={isLoading} />
          )}
        </div>

        <div className="text-center mt-6">
          <Button variant="link" onClick={() => navigate('/')}>
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
}
