// src/pages/AuthConfirm.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type VerifyStatus = "verifying" | "success" | "error";
type EmailVerifyType = "email" | "recovery" | "invite" | "email_change";

export default function AuthConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [status, setStatus] = useState<VerifyStatus>("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  // --- BACA SEKALI SAAT MOUNT (anti rerun saat query berubah/hilang) ---
  const ran = useRef(false);

  const initialToken =
    searchParams.get("token_hash") || searchParams.get("token") || "";
  const rawType = (searchParams.get("type") || "email").toLowerCase();
  const initialType: EmailVerifyType =
    rawType === "signup" || rawType === "magiclink"
      ? "email"
      : (rawType as EmailVerifyType);

  const tokenHashRef = useRef<string>(initialToken);
  const typeRef = useRef<EmailVerifyType>(initialType);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const confirmEmail = async () => {
      setStatus("verifying");
      setErrorMsg("");

      const tokenHash = tokenHashRef.current;
      const type = typeRef.current;

      if (!tokenHash || !type) {
        setStatus("error");
        setErrorMsg("Link verifikasi tidak valid atau tidak lengkap.");
        return;
      }

      // 0) Kalau session sudah ada (token sudah dipakai), anggap sukses
      const pre = await supabase.auth.getSession();
      if (pre.data.session) {
        setStatus("success");
        toast({
          title: "Berhasil!",
          description:
            "Email Anda telah berhasil diverifikasi. Selamat datang di CallMyCare!",
        });
        // Bersihkan query tapi efek tidak akan rerun karena sudah di-guard
        if (window.location.search)
          window.history.replaceState({}, "", "/auth/confirm");
        setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
        return;
      }

      try {
        // 1) Verifikasi token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type, // sudah ternormalisasi ke 'email' bila awalnya 'signup'/'magiclink'
        });

        if (error) {
          setStatus("error");
          setErrorMsg(
            error.status === 429
              ? "Terlalu banyak percobaan verifikasi. Mohon tunggu beberapa menit lalu coba lagi."
              : error.status === 403
              ? "Verifikasi gagal. Link mungkin sudah kedaluwarsa atau tidak valid."
              : `Verifikasi gagal: ${error.message}`
          );
          return;
        }

        // 2) Pastikan session aktif
        const session =
          data?.session ?? (await supabase.auth.getSession()).data.session;
        if (session) {
          setStatus("success");
          setErrorMsg("");
          if (window.location.search)
            window.history.replaceState({}, "", "/auth/confirm");
          toast({
            title: "Berhasil!",
            description:
              "Email Anda telah berhasil diverifikasi. Selamat datang di CallMyCare!",
          });
          setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
        } else {
          setStatus("success");
          setErrorMsg("");
          if (window.location.search)
            window.history.replaceState({}, "", "/auth/confirm");
          toast({
            title: "Berhasil!",
            description: "Email Anda terverifikasi. Silakan login.",
          });
        }
      } catch (e: any) {
        setStatus("error");
        setErrorMsg(
          e?.message ?? "Terjadi kesalahan tak terduga saat verifikasi."
        );
      }
    };

    confirmEmail();
  }, [navigate, toast]);

  const TitleIcon =
    status === "verifying"
      ? Loader2
      : status === "success"
      ? CheckCircle
      : XCircle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">CallMyCare</h1>
          <p className="text-muted-foreground mt-2">Verifikasi Email</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <TitleIcon
                className={`h-5 w-5 ${
                  status === "verifying" ? "animate-spin" : ""
                } ${status === "success" ? "text-green-500" : ""} ${
                  status === "error" ? "text-red-500" : ""
                }`}
              />
              {status === "verifying"
                ? "Memverifikasi Email..."
                : status === "success"
                ? "Email Terverifikasi!"
                : "Verifikasi Gagal"}
            </CardTitle>
            <CardDescription>
              {status === "verifying" &&
                "Mohon tunggu, kami sedang memverifikasi email Anda."}
              {status === "success" &&
                "Akun Anda telah berhasil diverifikasi. Anda akan diarahkan sebentar lagi."}
              {status === "error" &&
                "Terjadi kesalahan saat memverifikasi email Anda."}
            </CardDescription>
          </CardHeader>

          {status === "error" && (
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">{errorMsg}</p>
                <Button onClick={() => navigate("/auth")} className="w-full">
                  Kembali ke Login
                </Button>
              </div>
            </CardContent>
          )}

          {status === "success" && (
            <CardContent>
              <div className="text-center">
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="w-full"
                >
                  Lanjut ke Dashboard
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
