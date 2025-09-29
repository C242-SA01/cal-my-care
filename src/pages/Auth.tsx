import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

import { Button } from '@/components/ui/button';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Heart, Eye, EyeOff } from 'lucide-react';

// --- Validation Schemas ---
const signInSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid." }),
  password: z.string().min(1, { message: "Password tidak boleh kosong." }),
});

const signUpSchema = z.object({
  fullName: z.string().min(3, { message: "Nama lengkap minimal 3 karakter." }),
  email: z.string().email({ message: "Format email tidak valid." }),
  password: z.string().min(8, { message: "Password minimal 8 karakter." }),
});


export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, user, userProfile, isProfileLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- React Hook Form Initialization ---
  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  // --- Redirect if already logged in ---
  useEffect(() => {
    if (user && !isProfileLoading && userProfile) {
      const targetPath = userProfile.role === 'admin' || userProfile.role === 'midwife' ? '/admin' : '/dashboard';
      navigate(targetPath);
    }
  }, [user, isProfileLoading, userProfile, navigate]);

  // --- Error Message Mapper ---
  const mapAuthError = (message: string): string => {
    if (message.includes('Invalid login credentials')) {
      return 'Email atau password yang Anda masukkan salah. Silakan periksa kembali.';
    }
    if (message.includes('User already registered')) {
      return 'Email ini sudah terdaftar. Silakan gunakan email lain atau masuk.';
    }
    if (message.includes('Unable to validate email address')) {
      return 'Format email tidak valid. Mohon periksa kembali penulisan email Anda.';
    }
    if (message.includes('Password should be at least 8 characters')) {
        return 'Password harus memiliki minimal 8 karakter.';
    }
    return 'Terjadi kesalahan yang tidak diketahui. Silakan coba beberapa saat lagi.';
  };

  // --- Form Submit Handlers ---
  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(values.email, values.password);
      if (error) {
        throw error;
      }
      // The useEffect will handle the redirect on successful sign-in
    } catch (error: any) {
      toast({
        title: "Gagal Masuk",
        description: mapAuthError(error.message),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(values.email, values.password, values.fullName);
      if (error) {
        throw error;
      }
      toast({
        title: "Pendaftaran Berhasil!",
        description: "Akun Anda telah dibuat. Silakan cek email Anda untuk verifikasi.",
      });
      // Reset form and switch to sign-in tab
      signUpForm.reset();
      // Consider switching tabs here if you have a way to control the Tabs component state
    } catch (error: any) {
      toast({
        title: "Pendaftaran Gagal",
        description: mapAuthError(error.message),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold text-primary">CalMyCare</h1>
          </div>
          <p className="text-muted-foreground">
            Platform skrining kecemasan untuk ibu hamil primigravida
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Masuk</TabsTrigger>
            <TabsTrigger value="signup">Daftar</TabsTrigger>
          </TabsList>

          {/* Sign In Tab */}
          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Masuk ke Akun Anda</CardTitle>
                <CardDescription>Masukkan email dan password untuk melanjutkan</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                    <FormField
                      control={signInForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="nama@email.com" {...field} />
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
                          <FormLabel>Password</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input 
                                type={showPassword ? 'text' : 'password'} 
                                placeholder="Password Anda" 
                                {...field} 
                                className="pr-10"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <Eye className="h-4 w-4" aria-hidden="true" />
                              )}
                              <span className="sr-only">{showPassword ? "Sembunyikan password" : "Tampilkan password"}</span>
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Masuk
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sign Up Tab */}
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Buat Akun Baru</CardTitle>
                <CardDescription>Daftarkan diri Anda untuk memulai skrining</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                    <FormField
                      control={signUpForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap</FormLabel>
                          <FormControl>
                            <Input placeholder="Nama lengkap Anda" {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="nama@email.com" {...field} />
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
                          <FormLabel>Password</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input 
                                type={showPassword ? 'text' : 'password'} 
                                placeholder="Minimal 8 karakter" 
                                {...field} 
                                className="pr-10"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <Eye className="h-4 w-4" aria-hidden="true" />
                              )}
                              <span className="sr-only">{showPassword ? "Sembunyikan password" : "Tampilkan password"}</span>
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Daftar
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-6">
          <Button
            variant="link"
            onClick={() => navigate('/')}
            className="text-muted-foreground"
          >
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
}
