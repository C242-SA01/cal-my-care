import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { BookOpen, Video, FileText, AlertTriangle } from "lucide-react";

interface Material {
  id: string;
  title: string;
  content: string;
  material_type: string;
  anxiety_level: string | null;
  image_url: string | null;
}

const getAnxietyText = (level: string | null) => {
  if (!level) return "Semua Level";
  return level.charAt(0).toUpperCase() + level.slice(1);
};

const Education = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("educational_materials")
          .select("id, title, content, material_type, anxiety_level, image_url")
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setMaterials(data || []);
      } catch (error) {
        console.error("Error fetching materials:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  const MaterialCardSkeleton = () => (
    <Card className="animate-pulse">
      <div className="w-full h-40 bg-muted rounded-t-lg"></div>
      <CardHeader><div className="h-6 bg-muted rounded w-3/4"></div></CardHeader>
      <CardContent><div className="space-y-2"><div className="h-4 bg-muted rounded"></div><div className="h-4 bg-muted rounded w-5/6"></div></div></CardContent>
      <CardFooter><div className="h-8 bg-muted rounded w-1/4"></div></CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Materi Edukasi</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <MaterialCardSkeleton key={i} />)}
        </div>
      ) : materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Belum Ada Materi</h2>
          <p className="text-muted-foreground mt-2">Saat ini belum ada materi edukasi yang tersedia. Silakan cek kembali nanti.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {materials.map((material) => (
            <Card 
              key={material.id} 
              className="flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/education/${material.id}`)}
            >
              <CardHeader className="p-0">
                <img 
                  src={material.image_url || 'https://via.placeholder.com/400x225?text=CallMyCare'} 
                  alt={material.title} 
                  className="rounded-t-lg aspect-video object-cover"
                />
              </CardHeader>
              <div className="p-4 flex flex-col flex-grow">
                <CardTitle className="text-base font-semibold leading-tight mb-2 line-clamp-2">{material.title}</CardTitle>
                <div className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {material.content}
                  </p>
                </div>
                <CardFooter className="p-0 pt-4 flex justify-between items-center">
                  <Badge variant="outline">{getAnxietyText(material.anxiety_level)}</Badge>
                  <Badge variant={material.material_type === 'video' ? 'secondary' : 'outline'} className="flex items-center">
                    {material.material_type === 'video' ? <Video className="h-3 w-3 mr-1.5" /> : <FileText className="h-3 w-3 mr-1.5" />}
                    {material.material_type}
                  </Badge>
                </CardFooter>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Education;