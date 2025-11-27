// src/pages/EModuleDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import FlipbookViewer from '@/components/FlipbookViewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { getPublicUrl } from '@/lib/storage';

type EModule = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  file_url: string | null; // can be public URL or storage path
  published: boolean;
  cover_image_url: string | null;
  category?: string | null;
  tags?: string[] | null;
};

const EModuleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<EModule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [publicPdfUrl, setPublicPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Invalid module ID.');
      setLoading(false);
      return;
    }

    const fetchModule = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch module metadata from Supabase
        const { data, error: fetchError } = await supabase.from('e_modules').select('*').eq('id', id).single();

        if (fetchError || !data) {
          throw new Error(fetchError?.message || 'Module not found.');
        }

        // If module is not published, abort for non-admin users
        // (Assumption: RLS in DB prevents unauthorized access; still check)
        if (!data.published) {
          throw new Error('Module not found or not published.');
        }

        const moduleData: EModule = data;
        setModule(moduleData);

        // Normalize file_url: if it's already an absolute url (starts with http), use it.
        // Otherwise, try to convert storage path to public URL via getPublicUrl helper.
        if (moduleData.file_url) {
          const isAbsolute = /^https?:\/\//i.test(moduleData.file_url);
          if (isAbsolute) {
            setPublicPdfUrl(moduleData.file_url);
          } else {
            // if file_url is a storage path like "e-modules/xxx.pdf", convert
            try {
              const publicUrl = getPublicUrl(moduleData.file_url);
              if (publicUrl) setPublicPdfUrl(publicUrl);
              else {
                // fallback: try to construct using supabase storage api
                const { data: pu } = supabase.storage.from('e-modules').getPublicUrl(moduleData.file_url);
                setPublicPdfUrl(pu?.publicUrl ?? null);
              }
            } catch (err) {
              console.warn('Failed to build public URL from storage path:', err);
              setPublicPdfUrl(null);
            }
          }
        } else {
          setPublicPdfUrl(null);
        }
      } catch (err: any) {
        console.error('Failed to fetch module:', err);
        setError(err?.message ?? 'Failed to load module.');
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-pink-600" />
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive">Failed to Load Module</h2>
        <p className="text-muted-foreground mt-2">{error || 'The module you are looking for does not exist.'}</p>
        <Button variant="outline" onClick={() => navigate('/emodules')} className="mt-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to E-Module List
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <Button variant="outline" size="sm" onClick={() => navigate('/emodules')} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <article className="bg-white dark:bg-card border rounded-2xl overflow-hidden shadow-soft-lg">
        {/* Cover */}
        {module.cover_image_url && <img src={module.cover_image_url} alt={module.title} className="w-full h-56 md:h-72 object-cover rounded-t-2xl" />}

        <div className="p-6 md:p-8 bg-[#FFF0F4]">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-5 w-5 text-pink-600" />
            <p className="text-sm text-pink-500">E-Modul</p>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4 text-pink-700">{module.title}</h1>

          <p className="text-sm text-pink-500 mb-4">
            Published on:{' '}
            {new Date(module.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          {module.description && (
            <div className="prose prose-quoteless prose-neutral max-w-none mb-6 text-pink-700">
              <p>{module.description}</p>
            </div>
          )}

          {/* Flipbook viewer wrapper */}
          <div className="mt-4">
            {publicPdfUrl ? (
              <div className="rounded-xl border border-pink-50 bg-[#FFF0F4] p-4">
                <FlipbookViewer pdfUrl={publicPdfUrl} title={module.title} cover={module.cover_image_url ?? null} className="min-h-[64vh]" />
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-white">
                <h3 className="text-lg font-semibold text-pink-700">File tidak tersedia</h3>
                <p className="text-sm text-pink-500 mt-2">Modul ini belum memiliki file PDF yang dapat diakses. Silakan hubungi admin.</p>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
};

export default EModuleDetail;
