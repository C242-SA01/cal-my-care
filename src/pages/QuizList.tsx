import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QuizCard, QuizStatus } from '@/components/calmy/QuizCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ServerCrash, Frown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// --- NEW DATA STRUCTURES ---
interface QuizStatusDetail {
  status: QuizStatus;
  screening_id: string | null;
}

interface QuizStatusData {
  trimester_1: QuizStatusDetail;
  trimester_2: QuizStatusDetail;
  trimester_3: QuizStatusDetail;
  post_test: QuizStatusDetail;
}

const quizzesConfig = [
  {
    key: 'trimester_1' as const,
    title: 'Trimester 1',
    description: 'Skrining khusus untuk memantau kondisi Bunda di awal masa kehamilan.',
    info: 'Akan terbuka secara otomatis saat usia kehamilan Bunda memasuki Trimester 1.',
  },
  {
    key: 'trimester_2' as const,
    title: 'Trimester 2',
    description: 'Skrining lanjutan untuk Bunda yang memasuki pertengahan masa kehamilan.',
    info: 'Akan terbuka secara otomatis saat usia kehamilan Bunda memasuki Trimester 2.',
  },
  {
    key: 'trimester_3' as const,
    title: 'Trimester 3',
    description: 'Skrining di akhir masa kehamilan untuk mempersiapkan persalinan.',
    info: 'Akan terbuka secara otomatis saat usia kehamilan Bunda memasuki Trimester 3.',
  },
  {
    key: 'post_test' as const,
    title: 'Post Test',
    description: 'Kuesioner evaluasi yang dapat diisi untuk melihat perkembangan kondisi Bunda.',
    info: 'Dapat diakses kapan saja setelah menyelesaikan Pre-Test.',
  },
];

const QuizList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchQuizStatus = async () => {
    // The RPC now returns a single JSONB object, so .single() is appropriate.
    const { data, error } = await supabase.rpc('get_user_quiz_status').single();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Tidak dapat mengambil status kuis.');
    return data as QuizStatusData;
  };

  const {
    data: quizStatusData,
    isLoading,
    isError,
    error,
  } = useQuery<QuizStatusData>({
    queryKey: ['quizStatusV2', user?.id], // Use a new queryKey to avoid conflicts
    queryFn: fetchQuizStatus,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // --- UPDATED NAVIGATION LOGIC ---
  const handleCardClick = (quizType: keyof QuizStatusData, detail: QuizStatusDetail) => {
    if (detail.status === 'active') {
      navigate(`/quiz/${quizType}`);
    } else if (detail.status === 'completed' && detail.screening_id) {
      navigate('/results', { state: { screeningId: detail.screening_id } });
    }
    // For 'locked' status, the button is disabled, but this click handler won't do anything anyway.
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[60vh] text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium text-slate-700">Memuat Status Kuis...</p>
        <p className="text-sm text-slate-500">Menyinkronkan data riwayat dan profil Anda.</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <ServerCrash className="h-4 w-4" />
          <AlertTitle>Gagal Memuat Data</AlertTitle>
          <AlertDescription>
            Terjadi kesalahan saat mengambil status kuis Anda. Silakan coba lagi nanti.
            <p className="text-xs mt-2 font-mono">Detail: {error instanceof Error ? error.message : 'Unknown error'}</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!quizStatusData) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[60vh] text-center">
        <Frown className="h-10 w-10 text-slate-500 mb-4" />
        <p className="text-lg font-medium text-slate-700">Data Tidak Ditemukan</p>
        <p className="text-sm text-slate-500">Status kuis tidak dapat ditemukan. Coba muat ulang halaman.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800">Skrining Rutin</h1>
        <p className="text-md text-slate-500 mt-2">Pantau kondisi kesehatan mental Bunda secara berkala melalui serangkaian kuesioner yang dirancang sesuai dengan tahap kehamilan.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto pt-4">
        {quizzesConfig.map((quiz) => {
          const detail = quizStatusData[quiz.key];
          return <QuizCard key={quiz.key} title={quiz.title} description={detail.status === 'locked' ? quiz.info : quiz.description} status={detail.status} onClick={() => handleCardClick(quiz.key, detail)} />;
        })}
      </div>
    </div>
  );
};

export default QuizList;
