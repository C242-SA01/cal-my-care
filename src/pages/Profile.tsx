import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, User as UserIcon, Edit } from "lucide-react";

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
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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

      toast({ title: "Berhasil", description: "Profil Anda telah diperbarui." });
      await refreshUserProfile();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isProfileLoading) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Profil Saya</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/50">
            <AvatarImage src={userProfile?.avatar_url || undefined} alt={userProfile?.full_name || "User"} />
            <AvatarFallback className="text-2xl">{getInitials(userProfile?.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <CardTitle className="text-2xl">{userProfile?.full_name}</CardTitle>
            <CardDescription>{userProfile?.email}</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Edit className="h-4 w-4 mr-2"/>Edit Profil</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Profil</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fullName">Nama Lengkap</Label>
                  <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Usia</Label>
                  <Input id="age" type="number" value={age} onChange={e => setAge(e.target.value)} />
                </div>
                {userProfile?.role !== 'admin' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="gestationalAgeWeeks">Usia Kehamilan (minggu)</Label>
                      <Input id="gestationalAgeWeeks" type="number" value={gestationalAgeWeeks} onChange={e => setGestationalAgeWeeks(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trimester">Trimester</Label>
                      <Select value={trimester} onValueChange={setTrimester}>
                        <SelectTrigger><SelectValue placeholder="Pilih Trimester" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="I">Trimester 1</SelectItem>
                          <SelectItem value="II">Trimester 2</SelectItem>
                          <SelectItem value="III">Trimester 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="education">Pendidikan</Label>
                   <Select value={education} onValueChange={setEducation}>
                    <SelectTrigger><SelectValue placeholder="Pilih Pendidikan" /></SelectTrigger>
                    <SelectContent>
                      {['SD', 'SMP', 'SMA', 'D3', 'S1', 'S2', 'Lainnya'].map(edu => (
                        <SelectItem key={edu} value={edu}>{edu}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">Pekerjaan</Label>
                  <Input id="occupation" value={occupation} onChange={e => setOccupation(e.target.value)} />
                </div>
                <DialogFooter className="sm:col-span-2 mt-4">
                  <DialogClose asChild><Button variant="ghost">Batal</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Simpan Perubahan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{userProfile?.email || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Nomor Telepon</p>
              <p className="font-medium">{userProfile?.phone || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Usia</p>
              <p className="font-medium">{userProfile?.age ? `${userProfile.age} tahun` : '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Pendidikan</p>
              <p className="font-medium">{userProfile?.education || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Pekerjaan</p>
              <p className="font-medium">{userProfile?.occupation || '-'}</p>
            </div>
            {userProfile?.role !== 'admin' && (
              <>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Usia Kehamilan</p>
                  <p className="font-medium">{userProfile?.gestational_age_weeks ? `${userProfile.gestational_age_weeks} minggu` : '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Trimester</p>
                  <p className="font-medium">{userProfile?.trimester ? `Trimester ${userProfile.trimester}` : '-'}</p>
                </div>
              </>
            )}
             <div className="space-y-1">
              <p className="text-muted-foreground">Role</p>
              <p className="font-medium" style={{ textTransform: 'capitalize' }}>{userProfile?.role || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;