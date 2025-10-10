import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type VerifyStatus = 'verifying' | 'success' | 'error';
type EmailVerifyType = 'email' | 'recovery' | 'invite' | 'email_change';

const StatusIcon = ({ status }: { status: VerifyStatus }) => {
  const iconWrapperClass =
    'flex h-32 w-32 items-center justify-center rounded-full md:h-36 md:w-36';
  const iconClass = 'h-20 w-20 text-white md:h-24 md:w-24';

  if (status === 'success') {
    return (
      <div className={`${iconWrapperClass} bg-emerald-500`} aria-label="Success">
        <Check className={iconClass} strokeWidth={3} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`${iconWrapperClass} bg-rose-500`} aria-label="Error">
        <X className={iconClass} strokeWidth={3} />
      </div>
    );
  }

  return (
    <div
      className={`${iconWrapperClass} bg-gray-200 dark:bg-gray-700`}
      aria-label="Verifying"
    >
      <Loader2 className={`${iconClass} animate-spin text-gray-600 dark:text-gray-300`} />
    </div>
  );
};

const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [status, setStatus] = useState<VerifyStatus>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionExists, setSessionExists] = useState(false);

  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const confirmEmail = async () => {
      setStatus('verifying');
      setErrorMsg('');

      const tokenHash = searchParams.get('token_hash') || searchParams.get('token');
      const rawType = (searchParams.get('type') || 'email').toLowerCase();
      const type: EmailVerifyType =
        rawType === 'signup' || rawType === 'magiclink'
          ? 'email'
          : (rawType as EmailVerifyType);

      if (!tokenHash || !type) {
        setStatus('error');
        setErrorMsg('Link verifikasi tidak valid atau tidak lengkap.');
        return;
      }

      // Clean up URL
      if (window.location.search) {
        window.history.replaceState({}, '', '/auth/confirm');
      }

      const { data: preData } = await supabase.auth.getSession();
      if (preData.session) {
        setSessionExists(true);
        setStatus('success');
        return;
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

        if (error) {
          setStatus('error');
          setErrorMsg(
            error.status === 429
              ? 'Terlalu banyak percobaan. Mohon tunggu dan coba lagi.'
              : 'Link verifikasi mungkin sudah kedaluwarsa atau tidak valid.',
          );
          return;
        }

        if (data?.session) {
          setSessionExists(true);
        }
        setStatus('success');
      } catch (e: any) {
        setStatus('error');
        setErrorMsg(e?.message ?? 'Terjadi kesalahan tak terduga.');
      }
    };

    confirmEmail();
  }, [navigate, searchParams, toast]);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return {
          title: 'Memverifikasi Email…',
          subtitle: 'Mohon tunggu, kami sedang memverifikasi email Anda.',
          button: (
            <Button size="lg" disabled className="w-full rounded-full px-8 py-6">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memverifikasi...
            </Button>
          ),
        };
      case 'success':
        return {
          title: 'Verifikasi Email Sukses',
          subtitle: 'Selamat datang di CalmyCare',
          button: sessionExists ? (
            <Button
              size="lg"
              onClick={() => navigate('/dashboard', { replace: true })}
              className="w-full rounded-full bg-rose-400 px-8 py-6 text-lg text-white hover:bg-rose-500"
            >
              Mulai
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => navigate('/auth', { replace: true })}
              className="w-full rounded-full bg-rose-400 px-8 py-6 text-lg text-white hover:bg-rose-500"
            >
              Kembali ke Login
            </Button>
          ),
        };
      case 'error':
        return {
          title: 'Verifikasi Gagal',
          subtitle: errorMsg || 'Terjadi kesalahan saat memverifikasi email Anda.',
          button: (
            <Button
              size="lg"
              onClick={() => navigate('/auth', { replace: true })}
              className="w-full rounded-full bg-rose-400 px-8 py-6 text-lg text-white hover:bg-rose-500"
            >
              Kembali ke Login
            </Button>
          ),
        };
    }
  };

  const { title, subtitle, button } = renderContent();

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[#FCE1EA] px-6 dark:bg-[#0B0B10]">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-8">
          <StatusIcon status={status} />
        </div>

        <h1 className="mb-3 text-3xl font-bold text-slate-800 dark:text-slate-100 md:text-4xl">
          {title}
        </h1>

        <p className="mb-10 text-base text-slate-600 dark:text-slate-300 md:text-lg">
          {subtitle}
        </p>

        <div className="w-full pb-safe-bottom">{button}</div>
      </div>
    </div>
  );
};

export default AuthConfirm;