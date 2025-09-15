import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, User as UserIcon, Edit } from "lucide-react";

const Profile = () => {
  const { user, userProfile, isProfileLoading, refreshUserProfile } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [birthDate, setBirthDate] = useState(userProfile?.birth_date || '');
  const [gestationalAge, setGestationalAge] = useState(userProfile?.gestational_age || '');

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
          birth_date: birthDate || null,
          gestational_age: gestationalAge ? parseInt(String(gestationalAge), 10) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: "Berhasil", description: "Profil Anda telah diperbarui." });
      await refreshUserProfile(); // Refresh the user profile data
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profil</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nama Lengkap</Label>
                  <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Tanggal Lahir</Label>
                  <Input id="birthDate" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gestationalAge">Usia Kehamilan (minggu)</Label>
                  <Input id="gestationalAge" type="number" value={gestationalAge} onChange={e => setGestationalAge(e.target.value)} />
                </div>
                <DialogFooter>
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
              <p className="text-muted-foreground">Tanggal Lahir</p>
              <p className="font-medium">{userProfile?.birth_date ? new Date(userProfile.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Usia Kehamilan</p>
              <p className="font-medium">{userProfile?.gestational_age ? `${userProfile.gestational_age} minggu` : '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;