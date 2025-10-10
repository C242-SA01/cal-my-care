import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertTriangle, Video, FileText } from "lucide-react";

interface Material {
  id: string;
  title: string;
  content: string;
  material_type: string;
  anxiety_level: string | null;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
}

const getAnxietyText = (level: string | null) => {
  if (!level) return "Semua Level";
  return level.charAt(0).toUpperCase() + level.slice(1);
};

// Helper to convert YouTube watch URL to embed URL
const getEmbedUrl = (url: string | null) => {
  if (!url) return null;

  // Regex to capture video ID from various YouTube URL formats
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  
  const match = url.match(youtubeRegex);

  if (match && match[1]) {
    const videoId = match[1];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // If it's not a valid YouTube video URL, return null to prevent rendering a broken iframe.
  console.warn("Invalid or unsupported video URL:", url);
  return null;
};

const getPublicImageUrl = (path: string | null): string | null => {
  if (!path) {
    return null;
  }
  if (path.startsWith('http')) {
    return path;
  }
  const { data } = supabase.storage
    .from('educational_materials')
    .getPublicUrl(path);
  
  return encodeURI(data.publicUrl);
};

const EducationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("ID Materi tidak valid.");
      setLoading(false);
      return;
    }

    const fetchMaterial = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("educational_materials")
          .select("*")
          .eq("id", id)
          .eq("is_published", true)
          .single();

        if (error || !data) throw new Error("Materi tidak ditemukan atau belum dipublikasikan.");
        setMaterial(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive">Gagal Memuat Materi</h2>
        <p className="text-muted-foreground mt-2">{error || "Materi yang Anda cari tidak ada."}</p>
        <Button variant="outline" onClick={() => navigate("/education")} className="mt-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar Edukasi
        </Button>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(material.video_url);

  return (
    <div className="max-w-4xl mx-auto">
      <Button variant="outline" size="sm" onClick={() => navigate("/education")} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali
      </Button>

      <article className="bg-card border rounded-xl overflow-hidden">
        {material.image_url && material.material_type !== 'video' && (() => {
          const imageUrl = getPublicImageUrl(material.image_url);
          return imageUrl && <img src={imageUrl} alt={material.title} className="w-full h-auto max-h-80 object-cover" />;
        })()}

        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline">{getAnxietyText(material.anxiety_level)}</Badge>
            <Badge variant={material.material_type === 'video' ? 'secondary' : 'outline'} className="flex items-center">
              {material.material_type === 'video' ? <Video className="h-3 w-3 mr-1.5" /> : <FileText className="h-3 w-3 mr-1.5" />}
              {material.material_type}
            </Badge>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4">{material.title}</h1>
          
          <p className="text-sm text-muted-foreground mb-6">
            Dibuat pada: {new Date(material.created_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {material.material_type === 'video' && embedUrl && (
            <div className="aspect-video mb-6">
              <iframe
                width="100%"
                height="100%"
                src={embedUrl}
                title={material.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
              ></iframe>
            </div>
          )}

          <div className="prose prose-quoteless prose-neutral dark:prose-invert max-w-none">
            <p>{material.content}</p>
          </div>
        </div>
      </article>
    </div>
  );
};

export default EducationDetail;