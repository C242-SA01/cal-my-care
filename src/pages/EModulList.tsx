import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Edit, Trash2, BookOpen, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type EModule = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  file_url: string | null;
  published: boolean;
  cover_image_url: string | null;
};

export default function EModulList() {
  const [modules, setModules] = useState<EModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'midwife';

  useEffect(() => {
    const fetchModules = async () => {
      setIsLoading(true);
      
      let query = supabase
        .from("e_modules")
        .select("*")
        .order("created_at", { ascending: false });

      // If user is not an admin, only fetch published modules
      if (!isAdmin) {
        query = query.eq("published", true);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Error",
          description: "Gagal memuat e-modul.",
          variant: "destructive",
        });
        console.error(error);
      } else {
        setModules(data as EModule[]);
      }
      setIsLoading(false);
    };

    fetchModules();
  }, [toast, isAdmin]);

  const filteredModules = useMemo(() => {
    return modules.filter((module) =>
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [modules, searchTerm]);
  
  const handleDelete = async (moduleId: string) => {
    // First, get the file paths to delete from storage
    const moduleToDelete = modules.find(m => m.id === moduleId);
    if (!moduleToDelete) return;

    // Delete from e_modules table
    const { error: dbError } = await supabase
      .from("e_modules")
      .delete()
      .eq("id", moduleId);

    if (dbError) {
      toast({
        title: "Error",
        description: "Gagal menghapus modul.",
        variant: "destructive",
      });
      console.error(dbError);
      return;
    }
    
    // If DB deletion is successful, delete files from storage
    const filesToDelete: string[] = [];
    if (moduleToDelete.cover_image_url) {
        const coverPath = new URL(moduleToDelete.cover_image_url).pathname.split('/e_module_files/')[1];
        if(coverPath) filesToDelete.push(coverPath);
    }
    if (moduleToDelete.file_url) {
        const filePath = new URL(moduleToDelete.file_url).pathname.split('/e_module_files/')[1];
        if(filePath) filesToDelete.push(filePath);
    }

    if(filesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
            .from('e_module_files')
            .remove(filesToDelete);
        
        if (storageError) {
            console.error("Gagal menghapus file dari storage:", storageError);
            toast({
                title: "Warning",
                description: "Modul berhasil dihapus, namun beberapa file terkait gagal dihapus dari storage.",
                variant: "default",
            });
        }
    }

    toast({
      title: "Sukses",
      description: "E-Modul berhasil dihapus.",
    });

    setModules(modules.filter((module) => module.id !== moduleId));
  };


  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">E-Modul Edukasi</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Kelola materi edukasi untuk pasien." : "Materi edukasi untuk kesehatan mental Anda."}
          </p>
        </div>
        {isAdmin && (
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                 <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        type="search" 
                        placeholder="Cari judul atau deskripsi..." 
                        className="pl-8 w-full" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
                <Button asChild className="flex-shrink-0">
                    <Link to="/admin/emodules/new">
                        Tambah Materi
                    </Link>
                </Button>
            </div>
        )}
      </div>
      {modules.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
            <h2 className="text-xl font-semibold">Belum Ada Modul</h2>
            <p className="text-muted-foreground mt-2">
                {isAdmin ? "Mulai tambahkan modul edukasi baru." : "Saat ini belum ada modul edukasi yang tersedia. Silakan kembali lagi nanti."}
            </p>
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
            <h2 className="text-xl font-semibold">Modul Tidak Ditemukan</h2>
            <p className="text-muted-foreground mt-2">
                Tidak ada modul yang cocok dengan kriteria pencarian Anda.
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((module) => (
            <Card key={module.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="truncate pr-2">{module.title}</CardTitle>
                  {!module.published && <Badge variant="destructive">Draft</Badge>}
                </div>
                {module.description && <CardDescription className="line-clamp-2">{module.description}</CardDescription>}
              </CardHeader>
              <CardContent className="flex-grow">
                <img
                  src={module.cover_image_url || 'https://placehold.co/600x400/EEE/31343C?text=No+Image'}
                  alt={module.title}
                  className="rounded-md object-cover h-48 w-full"
                />
              </CardContent>
              <CardFooter className="flex gap-2">
                {isAdmin ? (
                  <>
                    <Button onClick={() => navigate(`/admin/emodules/${module.id}/edit`)} className="w-full">
                        <Edit className="mr-2 h-4 w-4"/> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                            <Trash2 className="mr-2 h-4 w-4"/> Hapus
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak bisa dibatalkan. Ini akan menghapus modul <span className="font-bold">"{module.title}"</span> secara permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(module.id)}>
                            Ya, Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                    <Button asChild className="w-full">
                        <Link to={`/emodules/${module.id}`}>
                            <BookOpen className="mr-2 h-4 w-4"/> Baca Selengkapnya
                        </Link>
                    </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
