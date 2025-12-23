import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const inputClasses = 'rounded-2xl border-pink-100 bg-white/80 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-0';
const selectTriggerClasses = 'rounded-2xl border-pink-100 bg-white/80 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-0';

interface OnboardingFormState {
  fullName: string;
  phone: string;
  age: string | number;
  gestationalAgeWeeks: string | number;
  trimester: string;
  education: string;
  occupation: string;
}

const OnboardingProfile = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const navigate = useNavigate(); // Instantiate navigate
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formState, setFormState] = useState<OnboardingFormState>({
    fullName: '',
    phone: '',
    age: '',
    gestationalAgeWeeks: '',
    trimester: '',
    education: '',
    occupation: '',
  });

  useEffect(() => {
    if (userProfile) {
      setFormState({
        fullName: userProfile.full_name || '',
        phone: userProfile.phone || '',
        age: userProfile.age || '',
        gestationalAgeWeeks: userProfile.gestational_age_weeks || '',
        trimester: userProfile.trimester || '',
        education: userProfile.education || '',
        occupation: userProfile.occupation || '',
      });
      setIsLoading(false);
    } else if (user) {
      // Still loading profile
      setIsLoading(true);
    } else {
      // No user session
      setIsLoading(false);
    }
  }, [userProfile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // --- Validasi Input ---
    const { fullName, phone, age, gestationalAgeWeeks, trimester, education, occupation } = formState;
    if (!fullName || !phone || !age || !gestationalAgeWeeks || !trimester || !education || !occupation) {
      toast({
        title: 'Data Belum Lengkap',
        description: 'Mohon lengkapi semua field yang wajib diisi sebelum melanjutkan.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // --- Update Profil di Supabase ---
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formState.fullName,
          phone: formState.phone,
          age: formState.age ? parseInt(String(formState.age), 10) : null,
          gestational_age_weeks: formState.gestationalAgeWeeks ? parseInt(String(formState.gestationalAgeWeeks), 10) : null,
          trimester: formState.trimester || null,
          education: formState.education || null,
          occupation: formState.occupation || null,
          updated_at: new Date().toISOString(),
          is_profile_complete: true, // <-- TAHAP PENTING: Menandai profil lengkap
        })
        .eq('id', user.id);

      if (profileError) throw profileError;
      
      // Refresh profile data in the app state
      await refreshUserProfile(); 

      toast({
        title: 'Profil Berhasil Disimpan',
        description: 'Terima kasih, Bunda. Sekarang kita lanjut ke tahap berikutnya ya.',
      });
      
      // *** THE FIX ***
      // Navigate to a gated route; the OnboardingGate will handle the rest.
      navigate('/dashboard', { replace: true });

    } catch (error: any) {
      toast({
        title: 'Gagal Menyimpan Profil',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-pink-50 to-amber-50/40">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 via-rose-50/60 to-amber-50/40 p-4">
      <Card className="w-full max-w-2xl rounded-3xl shadow-lg border-0">
        <CardHeader className="text-center p-6 sm:p-8">
          <CardTitle className="text-2xl font-semibold text-slate-800">Selamat Datang, Bunda!</CardTitle>
          <CardDescription className="text-slate-500 mt-2">
            Langkah 1 dari 2: Yuk, lengkapi profil dulu agar kami bisa memberikan panduan yang paling pas untuk Bunda.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 pt-0">
          <Alert className="bg-amber-100/60 border-amber-300 text-amber-800 rounded-2xl mb-6">
            <Info className="h-4 w-4 !text-amber-800" />
            <AlertDescription>
              Semua informasi yang Bunda berikan akan kami jaga kerahasiaannya.
            </AlertDescription>
          </Alert>
          <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form fields are divided into sections for clarity */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-pink-700">Data Diri</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="fullName">Nama Lengkap</Label>
                    <Input id="fullName" className={inputClasses} value={formState.fullName} onChange={(e) => setFormState({ ...formState, fullName: e.target.value })} placeholder="Tulis nama lengkap Bunda"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input id="phone" className={inputClasses} value={formState.phone} onChange={(e) => setFormState({ ...formState, phone: e.target.value })} placeholder="cth: 081234567890"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Usia (tahun)</Label>
                    <Input id="age" type="number" className={inputClasses} value={formState.age} onChange={(e) => setFormState({ ...formState, age: e.target.value })} placeholder="cth: 28"/>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-pink-700">Data Kehamilan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gestationalAgeWeeks">Usia Kehamilan (minggu)</Label>
                    <Input id="gestationalAgeWeeks" type="number" className={inputClasses} value={formState.gestationalAgeWeeks} onChange={(e) => setFormState({ ...formState, gestationalAgeWeeks: e.target.value })} placeholder="cth: 14"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trimester">Trimester</Label>
                    <Select value={formState.trimester} onValueChange={(value) => setFormState({ ...formState, trimester: value })}>
                      <SelectTrigger id="trimester" className={selectTriggerClasses}><SelectValue placeholder="Pilih Trimester" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="I">Trimester 1</SelectItem>
                        <SelectItem value="II">Trimester 2</SelectItem>
                        <SelectItem value="III">Trimester 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-pink-700">Data Demografi</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="education">Pendidikan Terakhir</Label>
                    <Select value={formState.education} onValueChange={(value) => setFormState({ ...formState, education: value })}>
                      <SelectTrigger id="education" className={selectTriggerClasses}><SelectValue placeholder="Pilih Pendidikan" /></SelectTrigger>
                      <SelectContent>
                        {['SD', 'SMP', 'SMA', 'D3', 'S1', 'S2', 'Lainnya'].map((edu) => (<SelectItem key={edu} value={edu}>{edu}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Pekerjaan</Label>
                    <Input id="occupation" className={inputClasses} value={formState.occupation} onChange={(e) => setFormState({ ...formState, occupation: e.target.value })} placeholder="cth: Ibu Rumah Tangga"/>
                  </div>
                </div>
              </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto rounded-2xl bg-pink-500 text-white hover:bg-pink-600 px-8 py-3 text-base">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Simpan dan Lanjutkan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingProfile;
