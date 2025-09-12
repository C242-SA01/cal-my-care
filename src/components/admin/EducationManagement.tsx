import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, Video, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

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

interface FormData {
  title: string;
  content: string;
  material_type: "article" | "video";
  anxiety_level: "minimal" | "mild" | "moderate" | "severe" | "";
  video_url: string;
  image_url: string;
  is_published: boolean;
}

const EducationManagement = () => {
  const [materials, setMaterials] = useState<EducationalMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMaterial, setEditingMaterial] = useState<EducationalMaterial | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    material_type: "article",
    anxiety_level: "",
    video_url: "",
    image_url: "",
    is_published: true,
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("educational_materials")
        .select("*")
        .order("created_at", { ascending: false });

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

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      material_type: "article",
      anxiety_level: "",
      video_url: "",
      image_url: "",
      is_published: true,
    });
    setEditingMaterial(null);
  };

  const handleEdit = (material: EducationalMaterial) => {
    setFormData({
      title: material.title,
      content: material.content,
      material_type: material.material_type as "article" | "video",
      anxiety_level: (material.anxiety_level as "" | "minimal" | "mild" | "moderate" | "severe") || "",
      video_url: material.video_url || "",
      image_url: material.image_url || "",
      is_published: material.is_published,
    });
    setEditingMaterial(material);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.content) {
        toast({
          title: "Error",
          description: "Judul dan konten harus diisi",
          variant: "destructive",
        });
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      
      const materialData = {
        ...formData,
        anxiety_level: formData.anxiety_level || null,
        video_url: formData.video_url || null,
        image_url: formData.image_url || null,
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
      resetForm();
      fetchMaterials();
    } catch (error) {
      console.error("Error saving material:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan materi edukasi",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus materi ini?")) {
      return;
    }

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

  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Manajemen Materi Edukasi</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
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
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Judul</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Masukkan judul materi"
                  />
                </div>

                <div>
                  <Label htmlFor="material_type">Tipe Materi</Label>
                  <Select
                    value={formData.material_type}
                    onValueChange={(value) => setFormData({ ...formData, material_type: value as "article" | "video" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Artikel</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="anxiety_level">Target Tingkat Kecemasan</Label>
                  <Select
                    value={formData.anxiety_level}
                    onValueChange={(value) => setFormData({ ...formData, anxiety_level: value as "" | "minimal" | "mild" | "moderate" | "severe" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tingkat kecemasan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua Level</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="mild">Ringan</SelectItem>
                      <SelectItem value="moderate">Sedang</SelectItem>
                      <SelectItem value="severe">Berat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="content">Konten</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Masukkan konten materi edukasi"
                    rows={6}
                  />
                </div>

                {formData.material_type === "video" && (
                  <div>
                    <Label htmlFor="video_url">URL Video</Label>
                    <Input
                      id="video_url"
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="image_url">URL Gambar</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label htmlFor="is_published">Publikasikan materi</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleSubmit}>
                  {editingMaterial ? "Perbarui" : "Simpan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Target Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada materi edukasi
                  </TableCell>
                </TableRow>
              ) : (
                materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {material.material_type === "video" ? (
                          <Video className="h-4 w-4 text-primary" />
                        ) : (
                          <FileText className="h-4 w-4 text-primary" />
                        )}
                        {material.material_type === "video" ? "Video" : "Artikel"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getAnxietyText(material.anxiety_level)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={material.is_published ? "default" : "secondary"}>
                        {material.is_published ? "Dipublikasikan" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(parseISO(material.created_at), "dd MMM yyyy", { locale: id })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(material)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(material.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EducationManagement;