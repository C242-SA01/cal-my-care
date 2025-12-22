import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { markFirstLoginAsCompleted } from '@/lib/user';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { Loader2, User as UserIcon, Edit, KeyRound, Info, AlertTriangle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';

const inputClasses = 'rounded-2xl border-pink-100 bg-white/80 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-0';
const selectTriggerClasses = 'rounded-2xl border-pink-100 bg-white/80 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-0';

interface ProfileFormState {
  fullName: string;
  phone: string;
  age: string | number;
  gestationalAgeWeeks: string | number;
  trimester: string;
  education: string;
  occupation: string;
}

const Profile = () => {
  const { user, userProfile, isProfileLoading, refreshUserProfile, isProfileComplete } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isFirstLogin = userProfile?.is_first_login === true && !isProfileComplete;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(isFirstLogin);
  
  const [formState, setFormState, clearFormState] = useFormPersistence<ProfileFormState>(
    `profile-form-draft-${user?.id || 'guest'}`,
    {
      fullName: '',
      phone: '',
      age: '',
      gestationalAgeWeeks: '',
      trimester: '',
      education: '',
      occupation: '',
    }
  );

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isRecoveryLoading, setIsRecoveryLoading] = useState(false);

  const isHealthStaff = userProfile?.role === 'admin' || userProfile?.role === 'midwife';

  useEffect(() => {
    if (userProfile && (isDialogOpen || isFirstLogin)) {
      setFormState({
        fullName: userProfile.full_name || '',
        phone: userProfile.phone || '',
        age: userProfile.age || '',
        gestationalAgeWeeks: userProfile.gestational_age_weeks || '',
        trimester: userProfile.trimester || '',
        education: userProfile.education || '',
        occupation: userProfile.occupation || '',
      });
    }
  }, [userProfile, isDialogOpen, isFirstLogin, setFormState]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!isHealthStaff && (!formState.fullName || !formState.phone || !formState.age || !formState.gestationalAgeWeeks || !formState.trimester || !formState.education || !formState.occupation)) {
      toast({
        title: 'Data Belum Lengkap',
        description: 'Mohon lengkapi semua field yang wajib diisi sebelum melanjutkan.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
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
        })
        .eq('id', user.id);

      if (error) throw error;
      
      clearFormState();
      await refreshUserProfile();

      if (isFirstLogin) {
        await markFirstLoginAsCompleted();
        toast({
          title: 'Selamat Datang!',
          description: 'Profil Anda telah berhasil disimpan. Anda kini dapat menjelajahi aplikasi.',
        });
        navigate('/dashboard', { replace: true });
      } else {
        toast({
          title: 'Berhasil',
          description: 'Profil Anda telah diperbarui.',
        });
      }

      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Password baru tidak cocok.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password minimal harus 6 karakter.', variant: 'destructive' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: 'Berhasil', description: 'Password Anda telah diperbarui.' });
      setIsPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handlePasswordRecovery = async () => {
    if (!user?.email) return;

    setIsRecoveryLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      toast({
        title: 'Terkirim',
        description: `Link pemulihan password telah dikirim ke ${user.email}. Silakan cek email Anda.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRecoveryLoading(false);
    }
  };


  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-pink-50 via-rose-50/60 to-amber-50/40 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {isFirstLogin && (
          <Alert className="bg-amber-100/60 border-amber-300 text-amber-800 rounded-2xl">
            <Info className="h-4 w-4 !text-amber-800" />
            <AlertDescription>
              Selamat datang di CalMyCare! Mohon lengkapi data profil Anda untuk melanjutkan.
            </AlertDescription>
          </Alert>
        )}

        {!isHealthStaff && !isProfileComplete && !isFirstLogin && (
          <Card className="bg-red-100/60 border-red-300 rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-700" />
                <div className='space-y-1'>
                  <CardTitle className="text-red-800 text-base">Profil Anda Belum Lengkap</CardTitle>
                  <CardDescription className="text-red-700 text-sm">
                    Mohon perbarui semua data wajib untuk fungsionalitas aplikasi yang optimal.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-red-200">
                  <AccordionTrigger className="text-red-700 hover:no-underline text-sm font-medium">
                    Bagaimana Cara Melengkapi Profil?
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 text-sm space-y-2 pt-2">
                    <p><strong>Langkah 1:</strong> Klik tombol <strong>"Edit Profil"</strong> berwarna pink yang ada di kartu profil Anda di bawah.</p>
                    <p><strong>Langkah 2:</strong> Pada formulir yang muncul, isi semua kolom di bagian <strong>Data Pribadi</strong>, <strong>Data Kehamilan</strong>, dan <strong>Data Demografi</strong>.</p>
                    <p><strong>Langkah 3:</strong> Setelah semua data terisi, klik tombol <strong>"Simpan Perubahan"</strong> di bagian bawah formulir untuk menyimpan informasi Anda.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">Profil Saya</h1>
            <p className="text-sm text-slate-500">Kelola data pribadi dan kehamilan Anda di CalMyCare.</p>
          </div>
        </div>

        <Card className="relative overflow-hidden rounded-3xl border-0 bg-gradient-to-r from-pink-100 via-rose-100 to-amber-50 shadow-md">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/30" />
          <CardHeader className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-white shadow-sm">
                <AvatarImage src={userProfile?.avatar_url || undefined} alt={userProfile?.full_name || 'User'} />
                <AvatarFallback className="text-2xl bg-pink-200 text-pink-700">{getInitials(userProfile?.full_name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-semibold text-slate-800">{userProfile?.full_name || 'Pengguna CalMyCare'}</CardTitle>
                <CardDescription className="text-sm text-slate-600">{userProfile?.email || 'Email belum tersedia'}</CardDescription>
                {userProfile?.role && <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-pink-700 shadow-sm">Role: {String(userProfile.role).toLowerCase()}</span>}
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-2 w-full rounded-2xl bg-pink-500 text-white hover:bg-pink-600 sm:mt-0 sm:w-auto">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profil
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[720px] rounded-3xl bg-white p-0">
                <DialogHeader className="p-6 pb-4 sm:p-8 sm:pb-6">
                  <DialogTitle className="text-lg font-semibold text-slate-800">
                    {isFirstLogin ? 'Lengkapi Profil Anda' : 'Edit Profil'}
                  </DialogTitle>
                  <p className="text-sm text-slate-500">
                    {isFirstLogin
                      ? 'Silakan isi semua data di bawah ini untuk mendapatkan pengalaman terbaik.'
                      : 'Perbarui data Anda agar rekomendasi CalMyCare lebih tepat.'
                    }
                  </p>
                </DialogHeader>

                <ScrollArea className="h-[65vh] sm:h-auto sm:max-h-[65vh]">
                  <form id="profile-form" onSubmit={handleSubmit} className="space-y-6 px-6 sm:px-8">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-pink-700">Data Pribadi</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="fullName">Nama Lengkap</Label>
                          <Input id="fullName" className={inputClasses} value={formState.fullName} onChange={(e) => setFormState({ ...formState, fullName: e.target.value })} />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label>Email</Label>
                          <div className="h-10 rounded-2xl border border-pink-100 bg-slate-50 px-3 text-sm flex items-center text-slate-500">{userProfile?.email || '-'}</div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Nomor Telepon</Label>
                          <Input id="phone" className={inputClasses} value={formState.phone} onChange={(e) => setFormState({ ...formState, phone: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="age">Usia</Label>
                          <Input id="age" type="number" className={inputClasses} value={formState.age} onChange={(e) => setFormState({ ...formState, age: e.target.value })} />
                        </div>
                      </div>
                      {!isFirstLogin && (
                        <div className="flex justify-end">
                          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                            <DialogTrigger asChild>
                              <Button type="button" variant="outline" className="rounded-2xl border-pink-200 bg-white text-pink-700 hover:bg-pink-50 hover:text-pink-800">
                                Ubah Password
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md rounded-3xl bg-white p-6 sm:p-8">
                              <DialogHeader>
                                <DialogTitle>Ubah Password</DialogTitle>
                                <CardDescription>Masukkan password baru Anda.</CardDescription>
                              </DialogHeader>
                              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="newPassword">Password Baru</Label>
                                  <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClasses} />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClasses} />
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button type="button" variant="ghost" className="rounded-2xl">Batal</Button>
                                  </DialogClose>
                                  <Button type="submit" disabled={isUpdatingPassword} className="rounded-2xl bg-pink-500 text-white hover:bg-pink-600">
                                    {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan Password Baru
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>

                    {!isHealthStaff && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-pink-700">Data Kehamilan</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="gestationalAgeWeeks">Usia Kehamilan (minggu)</Label>
                            <Input id="gestationalAgeWeeks" type="number" className={inputClasses} value={formState.gestationalAgeWeeks} onChange={(e) => setFormState({ ...formState, gestationalAgeWeeks: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="trimester">Trimester</Label>
                            <Select value={formState.trimester} onValueChange={(value) => setFormState({ ...formState, trimester: value })}>
                              <SelectTrigger id="trimester" className={selectTriggerClasses}>
                                <SelectValue placeholder="Pilih Trimester" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="I">Trimester 1</SelectItem>
                                <SelectItem value="II">Trimester 2</SelectItem>
                                <SelectItem value="III">Trimester 3</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 pb-6">
                      <h3 className="text-sm font-semibold text-pink-700">Data Demografi</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="education">Pendidikan</Label>
                          <Select value={formState.education} onValueChange={(value) => setFormState({ ...formState, education: value })}>
                            <SelectTrigger id="education" className={selectTriggerClasses}>
                              <SelectValue placeholder="Pilih Pendidikan" />
                            </SelectTrigger>
                            <SelectContent>
                              {['SD', 'SMP', 'SMA', 'D3', 'S1', 'S2', 'Lainnya'].map((edu) => (
                                <SelectItem key={edu} value={edu}>
                                  {edu}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="occupation">Pekerjaan</Label>
                          <Input id="occupation" className={inputClasses} value={formState.occupation} onChange={(e) => setFormState({ ...formState, occupation: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </form>
                </ScrollArea>
                
                <DialogFooter className="p-6 pt-0 sm:p-8 sm:pt-0">
                  {!isFirstLogin && (
                    <DialogClose asChild>
                      <Button type="button" variant="ghost" className="rounded-2xl">
                        Batal
                      </Button>
                    </DialogClose>
                  )}
                  <Button type="submit" form="profile-form" disabled={isSubmitting} className="rounded-2xl bg-pink-500 text-white hover:bg-pink-600">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isFirstLogin ? 'Simpan dan Lanjutkan' : 'Simpan Perubahan'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
        </Card>

        <Card className="rounded-3xl border-0 bg-white/80 shadow-lg backdrop-blur-sm">
          <CardContent className="p-5 sm:p-6 space-y-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-800">Data Pribadi</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div className="space-y-1">
                  <p className="text-slate-400">Nama Lengkap</p>
                  <p className="font-medium text-slate-800">{userProfile?.full_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400">Email</p>
                  <p className="font-medium text-slate-800">{userProfile?.email || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400">Nomor Telepon</p>
                  <p className="font-medium text-slate-800">{userProfile?.phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400">Usia</p>
                  <p className="font-medium text-slate-800">{userProfile?.age ? `${userProfile.age} tahun` : '-'}</p>
                </div>
              </div>
            </section>

            {!isHealthStaff && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-800">Data Kehamilan</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                  <div className="space-y-1">
                    <p className="text-slate-400">Usia Kehamilan</p>
                    <p className="font-medium text-slate-800">{userProfile?.gestational_age_weeks ? `${userProfile.gestational_age_weeks} minggu` : '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400">Trimester</p>
                    <p className="font-medium text-slate-800">{userProfile?.trimester ? `Trimester ${userProfile.trimester}` : '-'}</p>
                  </div>
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-800">Data Demografi</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div className="space-y-1">
                  <p className="text-slate-400">Pendidikan</p>
                  <p className="font-medium text-slate-800">{userProfile?.education || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400">Pekerjaan</p>
                  <p className="font-medium text-slate-800">{userProfile?.occupation || '-'}</p>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>
        
        <Card className="rounded-3xl border-0 bg-white/80 shadow-lg backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Keamanan & Pemulihan Akun</CardTitle>
            <CardDescription className="text-sm text-slate-500">Kelola keamanan akun Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-2xl border border-pink-100 bg-white">
                <div>
                    <h3 className="font-semibold text-slate-800">Pemulihan Akun</h3>
                    <p className="text-sm text-slate-500">Lupa password? Kami akan mengirimkan link untuk mengatur ulang password Anda.</p>
                </div>
                <Button onClick={handlePasswordRecovery} disabled={isRecoveryLoading} variant="outline" className="rounded-2xl border-pink-200 bg-white text-pink-700 hover:bg-pink-50 hover:text-pink-800">
                    {isRecoveryLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                    Kirim Link Pemulihan
                </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Profile;