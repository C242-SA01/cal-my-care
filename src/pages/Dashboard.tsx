import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { 
  Heart, 
  FileText, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Calendar,
  Loader2,
  LogOut,
  User
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'patient' | 'midwife' | 'admin';
  phone?: string;
  birth_date?: string;
  gestational_age?: number;
  is_primigravida: boolean;
  consent_given: boolean;
}

interface Screening {
  id: string;
  status: 'in_progress' | 'completed' | 'reviewed';
  total_score?: number;
  anxiety_level?: 'minimal' | 'mild' | 'moderate' | 'severe';
  started_at: string;
  completed_at?: string;
}

export default function Dashboard() {
  const { user, signOut, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      fetchProfile();
      fetchScreenings();
    }
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat profil pengguna",
        variant: "destructive",
      });
    }
  };

  const fetchScreenings = async () => {
    try {
      const { data, error } = await supabase
        .from('screenings')
        .select('*')
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      setScreenings(data || []);
    } catch (error: any) {
      console.error('Error fetching screenings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getAnxietyLevelColor = (level?: string) => {
    switch (level) {
      case 'minimal': return 'bg-green-100 text-green-800';
      case 'mild': return 'bg-yellow-100 text-yellow-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAnxietyLevelText = (level?: string) => {
    switch (level) {
      case 'minimal': return 'Minimal';
      case 'mild': return 'Ringan';
      case 'moderate': return 'Sedang';
      case 'severe': return 'Berat';
      default: return 'Belum selesai';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const latestScreening = screenings[0];
  const completedScreenings = screenings.filter(s => s.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-bold text-primary">CallMyCare</h1>
                <p className="text-sm text-muted-foreground">Dashboard Pengguna</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{profile?.full_name || user?.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">
            Selamat Datang, {profile?.full_name || 'Pengguna'}
          </h2>
          <p className="text-muted-foreground">
            Pantau kesehatan mental Anda selama kehamilan dengan mudah dan aman.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => navigate('/screening')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Skrining Baru</p>
                  <p className="text-2xl font-bold">GAD-7</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => navigate('/education')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Materi Edukasi</p>
                  <p className="text-2xl font-bold">Belajar</p>
                </div>
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Skrining</p>
                  <p className="text-2xl font-bold">{completedScreenings.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status Terakhir</p>
                  <p className="text-sm font-bold">
                    {latestScreening ? getAnxietyLevelText(latestScreening.anxiety_level) : 'Belum ada'}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Latest Screening */}
        {latestScreening && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Skrining Terbaru</CardTitle>
              <CardDescription>
                Hasil skrining GAD-7 Anda yang paling baru
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tanggal: {new Date(latestScreening.started_at).toLocaleDateString('id-ID')}
                  </p>
                  {latestScreening.total_score !== null && (
                    <p className="text-lg font-semibold">
                      Skor: {latestScreening.total_score}/21
                    </p>
                  )}
                </div>
                <Badge className={getAnxietyLevelColor(latestScreening.anxiety_level)}>
                  {getAnxietyLevelText(latestScreening.anxiety_level)}
                </Badge>
              </div>
              
              {latestScreening.total_score !== null && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress Skor</span>
                    <span>{latestScreening.total_score}/21</span>
                  </div>
                  <Progress value={(latestScreening.total_score / 21) * 100} className="h-2" />
                </div>
              )}

              {latestScreening.status === 'in_progress' && (
                <div className="mt-4">
                  <Button onClick={() => navigate('/screening')}>
                    Lanjutkan Skrining
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        {screenings.length === 0 && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <Heart className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Mulai Perjalanan Kesehatan Mental Anda</h3>
              <p className="text-muted-foreground mb-6">
                Lakukan skrining GAD-7 untuk mengetahui tingkat kecemasan Anda dan mendapatkan rekomendasi yang tepat.
              </p>
              <Button size="lg" onClick={() => navigate('/screening')}>
                Mulai Skrining GAD-7
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}