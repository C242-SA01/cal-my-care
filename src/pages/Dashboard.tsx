import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FileText, BookOpen, TrendingUp, Loader2, History } from 'lucide-react';
import { LatestReview } from '@/components/calmy/LatestReview';
import { getAnxietyInterpretation } from '@/lib/interpretationUtils';

interface Screening {
  id: string;
  status: 'in_progress' | 'completed' | 'reviewed';
  total_score: number | null;
  started_at: string;
  completed_at: string | null;
  trimester: number;
}

export default function Dashboard() {
  const { user, userProfile, isProfileLoading } = useAuth();
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [isScreeningLoading, setIsScreeningLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchScreenings();
    }
  }, [user]);

  const fetchScreenings = async () => {
    try {
      setIsScreeningLoading(true);
            const { data, error } = await supabase.from('screenings').select('id, status, total_score, started_at, completed_at, trimester').eq('user_id', user?.id).order('started_at', { ascending: false });

      if (error) throw error;
      setScreenings(data || []);
    } catch (error: any) {
      console.error('Error fetching screenings:', error);
    } finally {
      setIsScreeningLoading(false);
    }
  };

  const isLoading = isProfileLoading || isScreeningLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const latestScreening = screenings.find((s) => s.status === 'completed');
  const inProgressScreening = screenings.find((s) => s.status === 'in_progress');
  const completedScreeningsCount = screenings.filter((s) => s.status === 'completed').length;

  const interpretedAnxiety = getAnxietyInterpretation(latestScreening?.total_score);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Selamat Datang, {userProfile?.full_name || 'Bunda'}!</h1>
        <p className="text-muted-foreground mt-1">Pantau kesehatan mental Anda selama kehamilan dengan mudah dan aman.</p>
      </div>

      <LatestReview />

      {/* In-progress screening alert */}
      {inProgressScreening && (
        <Card className="bg-secondary border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-secondary-foreground">Skrining Belum Selesai</CardTitle>
              <CardDescription className="text-muted-foreground">Anda memiliki 1 sesi skrining yang belum diselesaikan.</CardDescription>
            </div>
            <Button onClick={() => navigate(`/quiz/${inProgressScreening.trimester}`)}>Lanjutkan Skrining</Button>
          </CardHeader>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col" onClick={() => navigate('/quiz')}>
          <CardHeader>
            <CardTitle>Skrining Baru</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex items-end justify-between">
            <p className="text-3xl font-bold">PASS</p>
            <FileText className="h-10 w-10 text-primary/70" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col" onClick={() => navigate('/education')}>
          <CardHeader>
            <CardTitle>Materi Edukasi</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex items-end justify-between">
            <p className="text-3xl font-bold">Belajar</p>
            <BookOpen className="h-10 w-10 text-primary/70" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col" onClick={() => navigate('/history')}>
          <CardHeader>
            <CardTitle>Total Skrining</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex items-end justify-between">
            <p className="text-3xl font-bold">{completedScreeningsCount}</p>
            <History className="h-10 w-10 text-primary/70" />
          </CardContent>
        </Card>

        <Card className="bg-secondary flex flex-col">
          <CardHeader>
            <CardTitle>Hasil Terakhir</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex items-end justify-between">
            <Badge variant={
              interpretedAnxiety.color === 'Merah' ? 'destructive' :
              interpretedAnxiety.color === 'Kuning' ? 'warning' :
              interpretedAnxiety.color === 'Hijau' ? 'success' :
              'secondary'
            } className="text-base">
              {interpretedAnxiety.level}
            </Badge>
            <TrendingUp className="h-10 w-10 text-primary/70" />
          </CardContent>
        </Card>
      </div>

      {/* Latest Screening Result */}
      {latestScreening && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Skrining Terbaru Anda</h2>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Hasil Skrining</CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate('/results', { state: { screeningId: latestScreening.id } })}>
                  Lihat Detail
                </Button>
              </div>
              {latestScreening.completed_at && <CardDescription>Diselesaikan pada {new Date(latestScreening.completed_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</CardDescription>}
            </CardHeader>
            <CardContent>
              {latestScreening.total_score !== null && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Skor: {latestScreening.total_score}/93</span>
                    <span className={`font-semibold ${interpretedAnxiety.className}`}>{interpretedAnxiety.level}</span>
                  </div>
                  <Progress value={(latestScreening.total_score / 93) * 100} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Initial Call to Action */}
      {screenings.length === 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/50 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Mulai Perjalanan Kesehatan Mental Anda</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Lakukan skrining PASS untuk mengetahui tingkat kecemasan Anda dan mendapatkan rekomendasi yang tepat.</p>
            <Button size="lg" onClick={() => navigate('/quiz')}>
              Mulai Skrining PASS
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
