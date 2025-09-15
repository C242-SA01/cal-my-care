import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Edit, Trash2, Video, FileText, Search, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EducationForm } from "./EducationForm";
import * as z from "zod";

// Simplified Zod schema
const formSchema = z.object({
  title: z.string().min(1, "Judul harus diisi"),
  content: z.string().min(1, "Konten harus diisi"),
  material_type: z.enum(["article", "video"]),
  anxiety_level: z.string().optional(),
  video_url: z.string().optional(),
  image_url: z.string().optional(),
  is_published: z.boolean(),
});

interface EducationalMaterial {
  id: string;
  title: string;
  content: string;
  material_type: string;
  anxiety_level: string | null;
  video_url: string | null;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
  created_by: string | null;
}

const EducationManagement = () => {
  const [materials, setMaterials] = useState<EducationalMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMaterial, setEditingMaterial] = useState<EducationalMaterial | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("educational_materials")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.ilike("title", `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error("Error fetching materials:", error);
      toast({
        title: "Error",
        description: "Gagal memuat materi edukasi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMaterials();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleEdit = (material: EducationalMaterial) => {
    setEditingMaterial(material);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const materialData = {
        ...values,
        anxiety_level: values.anxiety_level === 'all' ? null : values.anxiety_level,
        video_url: values.video_url || null,
        image_url: values.image_url || null,
        created_by: userData.user?.id,
      };

      if (editingMaterial) {
        const { error } = await supabase
          .from("educational_materials")
          .update(materialData)
          .eq("id", editingMaterial.id);

        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Materi edukasi berhasil diperbarui",
        });
      } else {
        const { error } = await supabase
          .from("educational_materials")
          .insert([materialData]);

        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Materi edukasi berhasil ditambahkan",
        });
      }

      setIsDialogOpen(false);
      setEditingMaterial(null);
      fetchMaterials();
    } catch (error) {
      console.error("Error saving material:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan materi edukasi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("educational_materials")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: "Materi edukasi berhasil dihapus",
      });
      
      fetchMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus materi edukasi",
        variant: "destructive",
      });
    }
  };

  const getAnxietyText = (level: string | null) => {
    switch (level) {
      case "minimal":
        return "Minimal";
      case "mild":
        return "Ringan";
      case "moderate":
        return "Sedang";
      case "severe":
        return "Berat";
      default:
        return "Semua Level";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Manajemen Materi Edukasi</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
              setIsDialogOpen(isOpen);
              if (!isOpen) {
                setEditingMaterial(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Materi
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingMaterial ? "Edit Materi Edukasi" : "Tambah Materi Edukasi"}
                  </DialogTitle>
                </DialogHeader>
                <EducationForm 
                  onSubmit={handleSubmit} 
                  initialData={editingMaterial ? {
                    ...editingMaterial,
                    anxiety_level: editingMaterial.anxiety_level || "all",
                    video_url: editingMaterial.video_url || "",
                    image_url: editingMaterial.image_url || "",
                  } : undefined}
                  isSubmitting={isSubmitting}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari materi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-8 bg-muted rounded w-3/4"></div></CardHeader>
              <CardContent><div className="h-4 bg-muted rounded w-full mb-2"></div><div className="h-4 bg-muted rounded w-5/6"></div></CardContent>
              <CardFooter><div className="h-8 bg-muted rounded w-1/4"></div></CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <p>Belum ada materi edukasi.</p>
            </div>
          ) : (
            materials.map((material) => (
              <Card key={material.id} className="flex flex-col">
                <CardHeader>
                  {material.image_url && (
                    <img src={material.image_url} alt={material.title} className="rounded-lg aspect-video object-cover mb-4" />
                  )}
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg leading-tight">{material.title}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(material)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Hapus</span>
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tindakan ini tidak dapat dibatalkan. Ini akan menghapus materi edukasi secara permanen.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(material.id)}>
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {material.content}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getAnxietyText(material.anxiety_level)}</Badge>
                    <Badge variant={material.material_type === 'video' ? 'secondary' : 'outline'}>
                      {material.material_type === 'video' ? <Video className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                      {material.material_type}
                    </Badge>
                  </div>
                  <Badge variant={material.is_published ? "default" : "secondary"}>
                    {material.is_published ? "Published" : "Draft"}
                  </Badge>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EducationManagement;
