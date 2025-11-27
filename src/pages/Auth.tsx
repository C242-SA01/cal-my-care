import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Heart,
  Mail,
  Lock,
  User2,
  Phone,
  Calendar,
  GraduationCap,
  Briefcase,
  Eye,
  EyeOff,
  ChevronsUpDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Validation Schemas
const signInSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid." }),
  password: z.string().min(1, { message: "Password tidak boleh kosong." }),
});

const signUpSchema = z.object({
  fullName: z.string().min(3, { message: "Nama lengkap minimal 3 karakter." }),
  age: z.coerce
    .number()
    .int()
    .min(10, "Usia minimal 10 tahun")
    .max(60, "Usia maksimal 60 tahun"),
  phone: z.string().min(8, "No. HP minimal 8 digit"),
  email: z.string().email({ message: "Format email tidak valid." }),
  password: z.string().min(8, { message: "Password minimal 8 karakter." }),
  gestationalAge: z.coerce
    .number()
    .int()
    .min(1, "Usia kehamilan minimal 1 minggu")
    .max(45, "Usia kehamilan maksimal 45 minggu"),
  trimester: z.enum(["1", "2", "3"]),
  education: z.enum(["SD", "SMP", "SMA", "D3", "S1", "S2", "Lainnya"]),
  occupation: z.string().min(2, { message: "Pekerjaan minimal 2 karakter." }),
});

type SignUpValues = z.infer<typeof signUpSchema>;

// Small UI helpers
function FieldIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="absolute inset-y-0 left-3 flex items-center text-rose-400">
      {icon}
    </div>
  );
}

// Main Auth Component
export default function Auth() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, user, userProfile, isProfileLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      age: undefined,
      phone: "",
      email: "",
      password: "",
      gestationalAge: undefined,
      trimester: undefined,
      education: undefined,
      occupation: "",
    },
  });

  useEffect(() => {
    if (user && !isProfileLoading && userProfile) {
      const targetPath =
        userProfile.role === "admin" || userProfile.role === "midwife"
          ? "/admin"
          : "/dashboard";
      navigate(targetPath);
    }
  }, [user, isProfileLoading, userProfile, navigate]);

  const mapAuthError = (message: string): string => {
    if (message.includes("Invalid login credentials"))
      return "Email atau password salah.";
    if (message.includes("User already registered"))
      return "Email ini sudah terdaftar.";
    if (message.includes("Unable to validate email address"))
      return "Format email tidak valid.";
    if (message.includes("Password should be at least 8 characters"))
      return "Password minimal 8 karakter.";
    return "Terjadi kesalahan. Silakan coba lagi.";
  };

  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(values.email, values.password);
      if (error) throw error;
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) throw error;
    } catch (e: any) {
      toast({
        title: "Gagal Masuk Google",
        description: mapAuthError(e?.message ?? ""),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (values: SignUpValues) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(
        values.email,
        values.password,
        values.fullName
      );
      if (error) throw error;

      localStorage.setItem(
        "callmycare.pendingProfile",
        JSON.stringify({
          full_name: values.fullName,
          age: values.age,
          phone: values.phone,
          email: values.email,
          gestational_age_weeks: values.gestationalAge,
          trimester: values.trimester,
          education: values.education,
          occupation: values.occupation,
        })
      );

      toast({
        title: "Pendaftaran Berhasil!",
        description: "Silakan cek email untuk verifikasi.",
      });
      signUpForm.reset();
      setTab("signin");
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
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-[#FAD2E1] to-[#FBE5EC] dark:from-[#0B0B10] dark:to-[#0B0B10]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const renderForm = () => {
    if (tab === "signin") {
      return (
        <>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              Selamat Datang ♥
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Masuk ke akun CalmyCare Anda
            </p>
          </div>
          <Form {...signInForm}>
            <form
              onSubmit={signInForm.handleSubmit(handleSignIn)}
              className="space-y-5 pt-6"
            >
              <FormField
                control={signInForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <FieldIcon icon={<Mail size={18} />} />
                        <Input
                          placeholder="nama@email.com"
                          className="h-12 rounded-xl pl-10 shadow-sm"
                          {...field}
                        />
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
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          className="h-12 rounded-xl pl-10 pr-10 shadow-sm"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
                          onClick={() => setShowPassword((s) => !s)}
                          aria-label={
                            showPassword ? "Sembunyikan" : "Tampilkan"
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-12 rounded-full bg-rose-400 hover:bg-rose-500 text-white shadow-md text-base"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
                Masuk
              </Button>
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full h-12 rounded-full bg-white dark:bg-transparent border dark:border-white/20 shadow-sm text-black hover:text-white hover:bg-rose-400 transition-colors"
                disabled={isLoading}
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt=""
                  className="h-5 w-5 mr-3"
                />{" "}
                Masuk dengan Google
              </Button>
            </form>
          </Form>
          <p className="text-center text-sm text-slate-600 dark:text-slate-300 pt-6">
            Belum punya akun?{" "}
            <button
              onClick={() => setTab("signup")}
              className="font-semibold text-rose-500 hover:underline"
            >
              Daftar sekarang
            </button>
          </p>
        </>
      );
    }

    return (
      <>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Buat Akun Baru
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Isi data untuk mendaftar
          </p>
        </div>
        <Form {...signUpForm}>
          <form
            onSubmit={signUpForm.handleSubmit(handleSignUp)}
            className="space-y-4 pt-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={signUpForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormControl>
                      <div className="relative">
                        <FieldIcon icon={<User2 size={18} />} />
                        <Input
                          placeholder="Nama Lengkap"
                          className="h-12 rounded-xl pl-10 shadow-sm"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signUpForm.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <FieldIcon icon={<Calendar size={18} />} />
                        <Input
                          type="number"
                          placeholder="Usia"
                          className="h-12 rounded-xl pl-10 shadow-sm"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signUpForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <FieldIcon icon={<Phone size={18} />} />
                        <Input
                          placeholder="No. Telepon"
                          className="h-12 rounded-xl pl-10 shadow-sm"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={signUpForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <FieldIcon icon={<Mail size={18} />} />
                      <Input
                        placeholder="Email"
                        className="h-12 rounded-xl pl-10 shadow-sm"
                        {...field}
                      />
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
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password (min. 8 karakter)"
                        className="h-12 rounded-xl pl-10 pr-10 shadow-sm"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={signUpForm.control}
                name="gestationalAge"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <FieldIcon icon={<Calendar size={18} />} />
                        <Input
                          type="number"
                          placeholder="Usia Kehamilan (minggu)"
                          className="h-12 rounded-xl pl-10 shadow-sm"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signUpForm.control}
                name="trimester"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <div className="relative">
                          <FieldIcon icon={<ChevronsUpDown size={18} />} />
                          <SelectTrigger className="h-12 rounded-xl pl-10 shadow-sm">
                            <SelectValue placeholder="Trimester" />
                          </SelectTrigger>
                        </div>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Trimester 1</SelectItem>
                        <SelectItem value="2">Trimester 2</SelectItem>
                        <SelectItem value="3">Trimester 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={signUpForm.control}
                name="education"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <div className="relative">
                          <FieldIcon icon={<GraduationCap size={18} />} />
                          <SelectTrigger className="h-12 rounded-xl pl-10 shadow-sm">
                            <SelectValue placeholder="Pendidikan" />
                          </SelectTrigger>
                        </div>
                      </FormControl>
                      <SelectContent>
                        {["SD", "SMP", "SMA", "D3", "S1", "S2", "Lainnya"].map(
                          (edu) => (
                            <SelectItem key={edu} value={edu}>
                              {edu}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signUpForm.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <div className="relative">
                      <FieldIcon icon={<Briefcase size={18} />} />
                      <FormControl>
                        <Input
                          placeholder="Pekerjaan"
                          className="h-12 rounded-xl pl-10 shadow-sm"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-full bg-rose-400 hover:bg-rose-500 text-white shadow-md text-base"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
              Daftar
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-slate-600 dark:text-slate-300 pt-6">
          Sudah punya akun?{" "}
          <button
            onClick={() => setTab("signin")}
            className="font-semibold text-rose-500 hover:underline"
          >
            Masuk
          </button>
        </p>
      </>
    );
  };

  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-[#FAD2E1] via-[#FBE5EC] to-[#FAD2E1] dark:from-[#0B0B10] dark:via-[#0B0B10] dark:to-[#0B0B10] flex items-center justify-center p-4 sm:p-6 pb-safe-bottom">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2.5 mb-2">
<img src="/assets/logo-CalMyCare.png" alt="CalmyCare Logo" className="h-10 w-10" />
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              CalmyCare
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Skrining kecemasan ibu hamil primigravida
          </p>
        </div>
        <div className="rounded-3xl shadow-xl bg-white/80 dark:bg-white/10 backdrop-blur-md p-6 sm:p-8">
          {renderForm()}
        </div>
        <div className="text-center mt-6">
          <Button
            variant="link"
            onClick={() => navigate("/")}
            className="text-slate-600 dark:text-slate-300"
          >
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
}
