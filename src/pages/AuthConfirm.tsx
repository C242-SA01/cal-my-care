import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (!tokenHash || !type) {
          setError('Invalid confirmation link');
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        });

        if (error) {
          setError(error.message);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setConfirmed(true);
          toast({
            title: "Berhasil!",
            description: "Email Anda telah berhasil diverifikasi. Selamat datang di CalMyCare!",
          });
          
          // Redirect to dashboard after successful confirmation
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      } catch (err: any) {
        setError(err.message);
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    confirmEmail();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">CalMyCare</h1>
          <p className="text-muted-foreground mt-2">Verifikasi Email</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {confirmed && <CheckCircle className="h-5 w-5 text-green-500" />}
              {error && <XCircle className="h-5 w-5 text-red-500" />}
              
              {loading && "Memverifikasi Email..."}
              {confirmed && "Email Terverifikasi!"}
              {error && "Verifikasi Gagal"}
            </CardTitle>
            <CardDescription>
              {loading && "Mohon tunggu, kami sedang memverifikasi email Anda."}
              {confirmed && "Akun Anda telah berhasil diverifikasi. Anda akan diarahkan ke dashboard dalam beberapa saat."}
              {error && "Terjadi kesalahan saat memverifikasi email Anda."}
            </CardDescription>
          </CardHeader>
          
          {error && (
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  {error}
                </p>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  Kembali ke Login
                </Button>
              </div>
            </CardContent>
          )}
          
          {confirmed && (
            <CardContent>
              <div className="text-center">
                <Button 
                  onClick={() => navigate('/dashboard')}
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
};

export default AuthConfirm;