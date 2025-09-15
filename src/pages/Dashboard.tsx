import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  BookOpen, 
  TrendingUp, 
  Loader2,
  History
} from 'lucide-react';

interface Screening {
  id: string;
  status: 'in_progress' | 'completed' | 'reviewed';
  total_score: number | null;
  anxiety_level: 'minimal' | 'mild' | 'moderate' | 'severe' | null;
  started_at: string;
  completed_at: string | null;
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
      const { data, error } = await supabase
        .from('screenings')
        .select('id, status, total_score, anxiety_level, started_at, completed_at')
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      setScreenings(data || []);
    } catch (error: any) {
      console.error('Error fetching screenings:', error);
    } finally {
      setIsScreeningLoading(false);
    }
  };

  const getAnxietyLevelColor = (level: string | null) => {
    switch (level) {
      case 'minimal': return 'bg-green-100 text-green-800';
      case 'mild': return 'bg-yellow-100 text-yellow-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAnxietyLevelText = (level: string | null) => {
    if (!level) return 'Belum Selesai';
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const isLoading = isProfileLoading || isScreeningLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const latestScreening = screenings.find(s => s.status === 'completed');
  const inProgressScreening = screenings.find(s => s.status === 'in_progress');
  const completedScreeningsCount = screenings.filter(s => s.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">
          Selamat Datang, {userProfile?.full_name || 'Pengguna'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Pantau kesehatan mental Anda selama kehamilan dengan mudah dan aman.
        </p>
      </div>

      {/* In-progress screening alert */}
      {inProgressScreening && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-blue-800">Skrining Belum Selesai</CardTitle>
              <CardDescription className="text-blue-700">Anda memiliki 1 sesi skrining yang belum diselesaikan.</CardDescription>
            </div>
            <Button onClick={() => navigate('/screening')}>Lanjutkan Skrining</Button>
          </CardHeader>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer flex flex-col" 
              onClick={() => navigate('/screening')}>
          <CardHeader><CardTitle>Skrining Baru</CardTitle></CardHeader>
          <CardContent className="flex-grow flex items-end justify-between">
            <p className="text-3xl font-bold">GAD-7</p>
            <FileText className="h-10 w-10 text-primary/70" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer flex flex-col" 
              onClick={() => navigate('/education')}>
          <CardHeader><CardTitle>Materi Edukasi</CardTitle></CardHeader>
          <CardContent className="flex-grow flex items-end justify-between">
            <p className="text-3xl font-bold">Belajar</p>
            <BookOpen className="h-10 w-10 text-primary/70" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer flex flex-col" 
              onClick={() => navigate('/history')}>
          <CardHeader><CardTitle>Total Skrining</CardTitle></CardHeader>
          <CardContent className="flex-grow flex items-end justify-between">
            <p className="text-3xl font-bold">{completedScreeningsCount}</p>
            <History className="h-10 w-10 text-primary/70" />
          </CardContent>
        </Card>

        <Card className="bg-muted/40 flex flex-col">
          <CardHeader><CardTitle>Hasil Terakhir</CardTitle></CardHeader>
          <CardContent className="flex-grow flex items-end justify-between">
            <Badge className={`${getAnxietyLevelColor(latestScreening?.anxiety_level)} text-base`}>
              {getAnxietyLevelText(latestScreening?.anxiety_level)}
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
                <Button variant="outline" size="sm" onClick={() => navigate('/results', { state: { screeningId: latestScreening.id } })}>Lihat Detail</Button>
              </div>
              {latestScreening.completed_at && (
                <CardDescription>
                  Diselesaikan pada {new Date(latestScreening.completed_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {latestScreening.total_score !== null && latestScreening.anxiety_level && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Skor: {latestScreening.total_score}/21</span>
                    <span className={`font-semibold ${getAnxietyLevelColor(latestScreening.anxiety_level).split(' ')[1]}`}>
                      {getAnxietyLevelText(latestScreening.anxiety_level)}
                    </span>
                  </div>
                  <Progress value={(latestScreening.total_score / 21) * 100} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Initial Call to Action */}
      {screenings.length === 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Mulai Perjalanan Kesehatan Mental Anda</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Lakukan skrining GAD-7 untuk mengetahui tingkat kecemasan Anda dan mendapatkan rekomendasi yang tepat.
            </p>
            <Button size="lg" onClick={() => navigate('/screening')}>
              Mulai Skrining GAD-7
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
