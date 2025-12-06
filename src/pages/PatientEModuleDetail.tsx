import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertTriangle, FileText, Download } from "lucide-react";
import FlipbookViewer from "@/components/admin/FlipbookViewer"; // Reusing the FlipbookViewer

type EModule = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  file_url: string | null;
  published: boolean;
  cover_image_url: string | null;
  flipbook_url: string | null; // Added flipbook_url
  category: string | null;
  tags: string[] | null;
};

const PatientEModuleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<EModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Invalid module ID.");
      setLoading(false);
      return;
    }

    const fetchModule = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("e_modules")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data || !data.published) {
          throw new Error("Module not found or not published.");
        }
        setModule(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 text-rose-700">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-semibold">Gagal Memuat E-Modul</h2>
        <p className="text-muted-foreground mt-2">{error || "E-Modul yang Anda cari tidak ditemukan atau belum dipublikasikan."}</p>
        <Button variant="outline" onClick={() => navigate("/emodules")} className="mt-6 text-rose-500 border-rose-300 hover:bg-rose-50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar E-Modul
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Button variant="outline" size="sm" onClick={() => navigate("/emodules")} className="mb-6 text-rose-500 border-rose-300 hover:bg-rose-50">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali
      </Button>

      <article className="bg-white rounded-xl overflow-hidden shadow-lg border border-rose-100">
        {module.cover_image_url && (
            <img 
              src={module.cover_image_url} 
              alt={module.title} 
              className="w-full h-48 md:h-64 object-cover" 
            />
        )}

        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4 text-rose-500">
             <FileText className="h-4 w-4" />
             <p className="text-sm font-medium">E-Modul</p>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4 text-rose-800">{module.title}</h1>
          
          <p className="text-sm text-gray-500 mb-6">
            Dipublikasikan pada: {new Date(module.created_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          {module.description && (
            <div className="prose prose-sm prose-pink max-w-none mb-8">
                <p>{module.description}</p>
            </div>
          )}

          {module.file_url && (
            <div className="my-8 text-center">
              <Button asChild size="lg" className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800">
                <a href={module.file_url} download={`${module.title || 'e-modul'}.pdf`} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-5 w-5" />
                  Download Materi
                </a>
              </Button>
            </div>
          )}

          <div className="mt-8">
            {module.file_url ? (
              <FlipbookViewer 
                pdfUrl={module.file_url} 
                title={module.title} 
                cover={module.cover_image_url}
              />
            ) : (
                <div className="text-center py-12 border border-rose-200 rounded-lg bg-rose-50">
                    <h3 className="text-lg font-semibold text-rose-700">Tidak ada file modul yang tersedia</h3>
                    <p className="text-muted-foreground mt-1">Silakan hubungi administrator.</p>
                </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
};

export default PatientEModuleDetail;
