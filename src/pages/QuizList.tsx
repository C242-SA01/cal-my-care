import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, CheckCircle, PlayCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// --- Helper Functions ---
const getTrimesterFromWeek = (week: number | null): number | null => {
  if (week === null || week < 1) return null;
  if (week >= 1 && week <= 12) return 1;
  if (week >= 13 && week <= 27) return 2;
  if (week >= 28 && week <= 40) return 3; // Assuming a 40-week pregnancy
  return null;
};

const QuizList = () => {
  const { userProfile, isProfileLoading } = useAuth();
  const navigate = useNavigate();

  // 1. Fetch completed screenings for the current user
  const { data: completedScreenings, isLoading: isScreeningsLoading } = useQuery({
    queryKey: ['completedScreenings', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      const { data, error } = await supabase
        .from('screenings')
        .select('trimester')
        .eq('user_id', userProfile.id)
        .eq('status', 'completed')
        .in('trimester', [1, 2, 3]);

      if (error) {
        console.error('Error fetching completed screenings:', error);
        throw new Error(error.message);
      }
      return data.map(item => item.trimester);
    },
    enabled: !!userProfile?.id,
  });

  // 2. Determine user's current state
  const gestationalAge = userProfile?.gestational_age_weeks; // Assuming this field name, e.g., 'gestational_age_weeks'
  const currentTrimester = getTrimesterFromWeek(gestationalAge);

  // 3. Define the quizzes and their statuses
  const quizzes = useMemo(() => {
    const quizData = [
      { id: 1, title: 'Quiz Trimester 1', description: 'Usia kehamilan 1-12 minggu' },
      { id: 2, title: 'Quiz Trimester 2', description: 'Usia kehamilan 13-27 minggu' },
      { id: 3, title: 'Quiz Trimester 3', description: 'Usia kehamilan 28-40 minggu' },
    ];

    if (!completedScreenings) return [];

    return quizData.map(quiz => {
      const isCompleted = completedScreenings.includes(quiz.id);
      const isCurrentTrimester = quiz.id === currentTrimester;
      const isLocked = !isCurrentTrimester && !isCompleted;
      
      let status: 'Tersedia' | 'Belum Waktunya' | 'Sudah Dikerjakan' = 'Belum Waktunya';
      if (isCompleted) {
        status = 'Sudah Dikerjakan';
      } else if (isCurrentTrimester) {
        status = 'Tersedia';
      }

      return {
        ...quiz,
        status,
        isLocked,
        path: `/quiz/${quiz.id}`
      };
    });
  }, [currentTrimester, completedScreenings]);

  // --- Render Logic ---

  if (isProfileLoading || isScreeningsLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If gestational age is not set
  if (gestationalAge === null || gestationalAge === undefined) {
    return (
      <Alert variant="default" className="m-4">
        <AlertTitle>Lengkapi Profil Anda</AlertTitle>
        <AlertDescription>
          Silakan lengkapi data usia kehamilan Anda pada halaman profil untuk dapat mengakses quiz.
        </AlertDescription>
        <Button onClick={() => navigate('/profile')} className="mt-4">
          Ke Halaman Profil
        </Button>
      </Alert>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Quiz Skrining Kecemasan</h1>
        <p className="text-muted-foreground">Kerjakan quiz sesuai dengan usia kehamilan Anda.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map(quiz => (
          <Card 
            key={quiz.id}
            className={`transition-all ${quiz.isLocked ? 'bg-muted/50 opacity-70' : 'bg-white'}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {quiz.title}
                {quiz.isLocked && <Lock className="h-5 w-5 text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{quiz.description}</p>
              
              <div className="flex items-center text-sm font-medium">
                {quiz.status === 'Sudah Dikerjakan' && <CheckCircle className="h-4 w-4 mr-2 text-green-500" />}
                {quiz.status === 'Tersedia' && <PlayCircle className="h-4 w-4 mr-2 text-primary" />}
                {quiz.status === 'Belum Waktunya' && <Lock className="h-4 w-4 mr-2 text-muted-foreground" />}
                Status: {quiz.status}
              </div>

              <Button
                asChild
                disabled={quiz.status !== 'Tersedia'}
                className="w-full"
              >
                <Link to={quiz.path}>
                  {quiz.status === 'Tersedia' ? 'Mulai Quiz' : 'Terkunci'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuizList;
