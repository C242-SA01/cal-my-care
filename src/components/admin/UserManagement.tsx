import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { 
  Loader2, AlertTriangle, ShieldCheck, ShieldOff, UserPlus, UserMinus 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


interface ManagedUser {
  user_id: string;
  full_name: string | null;
  email: string | null; // Note: Email is not available directly from profiles table.
  role: string | null;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // The user's request requires changing the role in the 'profiles' table.
      // Therefore, we fetch directly from 'profiles'.
      // Note: This means we can't easily get the user's email, which is in 'auth.users'.
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role');

      if (error) throw error;

      const mappedUsers = data.map(profile => ({
        user_id: profile.id,
        full_name: profile.full_name,
        email: null, // Email is not easily available with this query
        role: profile.role,
      }));

      setUsers(mappedUsers || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error Memuat Pengguna",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (targetUser: ManagedUser, action: 'grant' | 'revoke') => {
    const grantAdmin = action === 'grant';
    const successMessage = action === 'grant' ? "Pengguna berhasil dijadikan admin." : "Status admin berhasil dicabut.";

    try {
      const { error } = await supabase.rpc('set_admin_status', {
        target_user_id: targetUser.user_id,
        grant_admin: grantAdmin
      });

      if (error) throw error;

      toast({ title: "Berhasil", description: successMessage });
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      toast({
        title: "Aksi Gagal",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="flex flex-col items-center justify-center h-64 text-red-600"><AlertTriangle className="h-8 w-8 mb-2" /><p>{error}</p></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Pengguna</CardTitle>
        <CardDescription>Jadikan pengguna lain sebagai admin atau cabut hak akses admin mereka.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Pengguna</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div className="font-medium">{user.full_name || 'Tanpa Nama'}</div>
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Badge variant="default" className="bg-primary text-primary-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pengguna</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.role === 'admin' ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={user.user_id === currentUser?.id} // Disable revoking self
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Cabut Admin
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tindakan ini akan mencabut hak akses admin dari pengguna <strong>{user.full_name}</strong>. Mereka tidak akan bisa lagi mengakses menu admin.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRoleChange(user, 'revoke')}>
                              Ya, Cabut Akses
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Jadikan Admin
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tindakan ini akan memberikan hak akses admin penuh kepada pengguna <strong>{user.full_name}</strong>. Mereka akan bisa mengelola semua aspek aplikasi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRoleChange(user, 'grant')}>
                              Ya, Jadikan Admin
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">Tidak ada pengguna ditemukan.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
