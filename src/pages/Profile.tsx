import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, User as UserIcon, Edit } from 'lucide-react';

const inputClasses = 'rounded-2xl border-pink-100 bg-white/80 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-0';
const selectTriggerClasses = 'rounded-2xl border-pink-100 bg-white/80 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-0';

const Profile = () => {
  const { user, userProfile, isProfileLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<string | number>('');
  const [gestationalAgeWeeks, setGestationalAgeWeeks] = useState<string | number>('');
  const [trimester, setTrimester] = useState('');
  const [education, setEducation] = useState('');
  const [occupation, setOccupation] = useState('');

  const isHealthStaff = userProfile?.role === 'admin' || userProfile?.role === 'midwife';

  useEffect(() => {
    if (userProfile && isDialogOpen) {
      setFullName(userProfile.full_name || '');
      setPhone(userProfile.phone || '');
      setAge(userProfile.age || '');
      setGestationalAgeWeeks(userProfile.gestational_age_weeks || '');
      setTrimester(userProfile.trimester || '');
      setEducation(userProfile.education || '');
      setOccupation(userProfile.occupation || '');
    }
  }, [userProfile, isDialogOpen]);

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

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          age: age ? parseInt(String(age), 10) : null,
          gestational_age_weeks: gestationalAgeWeeks ? parseInt(String(gestationalAgeWeeks), 10) : null,
          trimester: trimester || null,
          education: education || null,
          occupation: occupation || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Profil Anda telah diperbarui.',
      });
      await refreshUserProfile();
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
        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">Profil Saya</h1>
            <p className="text-sm text-slate-500">Kelola data pribadi dan kehamilan Anda di CalMyCare.</p>
          </div>
        </div>

        {/* Profile header card */}
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

            {/* Edit dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-2 w-full rounded-2xl bg-pink-500 text-white hover:bg-pink-600 sm:mt-0 sm:w-auto">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profil
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[720px] rounded-3xl bg-white p-6 sm:p-8">
                <DialogHeader className="space-y-1">
                  <DialogTitle className="text-lg font-semibold text-slate-800">Edit Profil</DialogTitle>
                  <p className="text-sm text-slate-500">Perbarui data Anda agar rekomendasi CalMyCare lebih tepat.</p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                  {/* Data Pribadi */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-pink-700">Data Pribadi</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="fullName">Nama Lengkap</Label>
                        <Input id="fullName" className={inputClasses} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Email</Label>
                        <div className="h-10 rounded-2xl border border-pink-100 bg-slate-50 px-3 text-sm flex items-center text-slate-500">{userProfile?.email || '-'}</div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Nomor Telepon</Label>
                        <Input id="phone" className={inputClasses} value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">Usia</Label>
                        <Input id="age" type="number" className={inputClasses} value={age} onChange={(e) => setAge(e.target.value)} />
                      </div>
                    </div>
                    {/* Opsional: tombol ubah password (placeholder, tanpa logic) */}
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" className="rounded-2xl border-pink-200 bg-white text-pink-700 hover:bg-pink-50 hover:text-pink-800">
                        Ubah Password
                      </Button>
                    </div>
                  </div>

                  {/* Data Kehamilan – hidden untuk admin & bidan */}
                  {!isHealthStaff && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-pink-700">Data Kehamilan</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="gestationalAgeWeeks">Usia Kehamilan (minggu)</Label>
                          <Input id="gestationalAgeWeeks" type="number" className={inputClasses} value={gestationalAgeWeeks} onChange={(e) => setGestationalAgeWeeks(e.target.value)} />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label>Status Ibu (Primigravida)</Label>
                          <div className="h-10 rounded-2xl border border-pink-100 bg-slate-50 px-3 text-sm flex items-center text-slate-500">
                            {/* Sesuaikan dengan field sebenarnya di Supabase, misal is_primigravida/pregnancy_status */}
                            {userProfile?.pregnancy_status || '-'}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="trimester">Trimester</Label>
                          <Select value={trimester} onValueChange={setTrimester}>
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

                  {/* Data Demografi */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-pink-700">Data Demografi</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="education">Pendidikan</Label>
                        <Select value={education} onValueChange={setEducation}>
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
                        <Input id="occupation" className={inputClasses} value={occupation} onChange={(e) => setOccupation(e.target.value)} />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Role</Label>
                        <div className="h-10 rounded-2xl border border-pink-100 bg-slate-50 px-3 text-sm flex items-center text-slate-500">{userProfile?.role ? String(userProfile.role).toLowerCase() : '-'}</div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="mt-4 flex items-center justify-end gap-2">
                    <DialogClose asChild>
                      <Button type="button" variant="ghost" className="rounded-2xl">
                        Batal
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting} className="rounded-2xl bg-pink-500 text-white hover:bg-pink-600">
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Simpan Perubahan
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
        </Card>

        {/* Main profile details card */}
        <Card className="rounded-3xl border-0 bg-white/80 shadow-lg backdrop-blur-sm">
          <CardContent className="p-5 sm:p-6 space-y-6">
            {/* Data Pribadi */}
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

            {/* Data Kehamilan – hidden untuk admin & bidan */}
            {!isHealthStaff && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-800">Data Kehamilan</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-slate-400">Usia Kehamilan</p>
                    <p className="font-medium text-slate-800">{userProfile?.gestational_age_weeks ? `${userProfile.gestational_age_weeks} minggu` : '-'}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-slate-400">Status Ibu (Primigravida / lainnya)</p>
                    <p className="font-medium text-slate-800">{userProfile?.pregnancy_status || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400">Trimester</p>
                    <p className="font-medium text-slate-800">{userProfile?.trimester ? `Trimester ${userProfile.trimester}` : '-'}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Data Demografi */}
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
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-slate-400">Role</p>
                  <p className="font-medium text-slate-800" style={{ textTransform: 'capitalize' }}>
                    {userProfile?.role || '-'}
                  </p>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
