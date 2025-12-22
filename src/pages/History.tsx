import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History as HistoryIcon, Loader2, AlertTriangle, FileText, ChevronRight, MessageSquare, BarChart2, LineChart } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


interface ScreeningHistory {
  id: string;
  completed_at: string;
  total_score: number;
  anxiety_level: 'normal' | 'ringan' | 'sedang' | 'berat';
  status: 'completed' | 'reviewed';
  notes: string | null;
  trimester: number;
}

const badgeColorMap: { [key: string]: string } = {
  normal: 'bg-green-100 text-green-800 hover:bg-green-200',
  ringan: 'bg-green-100 text-green-800 hover:bg-green-200',
  sedang: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  berat: 'bg-red-100 text-red-800 hover:bg-red-200',
};

const History = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ScreeningHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('screenings')
          .select('id, completed_at, total_score, anxiety_level, status, notes, trimester')
          .eq('user_id', user.id)
          .in('status', ['completed', 'reviewed'])
          .order('completed_at', { ascending: true }); // Ascending to easily find first and last

        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error('Error fetching screening history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const chartData = useMemo(() => {
    const dataByTrimester: { [key: number]: ScreeningHistory[] } = { 1: [], 2: [], 3: [] };
    history.forEach(item => {
      if (item.trimester in dataByTrimester) {
        dataByTrimester[item.trimester].push(item);
      }
    });

    const prePostData = [1, 2, 3].map(trimester => {
      const screenings = dataByTrimester[trimester];
      if (screenings.length === 0) {
        return { name: `Trimester ${trimester}`, 'Pre-Test': 0, 'Post-Test': 0 };
      }
      const firstTest = screenings[0].total_score;
      const lastTest = screenings[screenings.length - 1].total_score;
      return { name: `Trimester ${trimester}`, 'Pre-Test': firstTest, 'Post-Test': lastTest };
    });

    const trendData = [1, 2, 3].map(trimester => {
        const screenings = dataByTrimester[trimester];
        const latestScore = screenings.length > 0 ? screenings[screenings.length - 1].total_score : null;
        return { name: `T${trimester}`, Skor: latestScore };
    }).filter(item => item.Skor !== null);

    return { prePostData, trendData };
  }, [history]);

  const handleViewResult = (screeningId: string) => {
    navigate('/results', { state: { screeningId } });
  };

  const HistoryCardSkeleton = () => (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50 animate-pulse">
      <div className="space-y-2">
        <div className="h-5 w-32 bg-muted-foreground/20 rounded"></div>
        <div className="h-4 w-24 bg-muted-foreground/20 rounded"></div>
      </div>
      <div className="h-8 w-20 bg-muted-foreground/20 rounded-full"></div>
    </div>
  );

  const getAnxietyLevelText = (level: string | null) => {
    if (!level) return 'Belum Selesai';
    if (level === 'ringan') return 'Cemas Ringan';
    if (level === 'sedang') return 'Cemas Sedang';
    if (level === 'berat') return 'Cemas Berat';
    return level.charAt(0).toUpperCase() + level.slice(1); // For 'Normal'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HistoryIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Care</h1>
        <Badge variant="outline" className="text-sm">Analisis & Riwayat</Badge>
      </div>
      
      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="animate-pulse"><CardContent className="h-80 p-6 bg-muted/50 rounded-lg"></CardContent></Card>
          <Card className="animate-pulse"><CardContent className="h-80 p-6 bg-muted/50 rounded-lg"></CardContent></Card>
        </div>
      ) : history.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary"/>Perbandingan Pre & Post Test</CardTitle>
              <CardDescription>Perbandingan skor skrining pertama (Pre-Test) dan terakhir (Post-Test) per trimester.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={chartData.prePostData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 93]}/>
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Pre-Test" fill="#8884d8" />
                  <Bar dataKey="Post-Test" fill="#82ca9d" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5 text-primary"/>Tren Skor Antar Trimester</CardTitle>
              <CardDescription>Perkembangan skor skrining terakhir Anda dari trimester ke trimester.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={chartData.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 93]}/>
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Skor" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Lengkap</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            {loading ? (
                <div className="space-y-4 p-4">
                {[...Array(3)].map((_, i) => (
                    <HistoryCardSkeleton key={i} />
                ))}
                </div>
            ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold">Belum Ada Riwayat</h2>
                    <p className="text-muted-foreground mt-2 max-w-sm">Mulai skrining pertama Anda untuk melihat analisis dan riwayatnya di sini.</p>
                    <Button onClick={() => navigate('/quiz')} className="mt-6">
                        <FileText className="h-4 w-4 mr-2" />
                        Mulai Skrining Sekarang
                    </Button>
                </div>
            ) : (
                <div className="divide-y">
                {history.slice().reverse().map((item) => ( // Reverse to show latest first
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => handleViewResult(item.id)}>
                    <div>
                        <p className="font-semibold">
                        {new Date(item.completed_at).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">Skor: {item.total_score} / 93 (Trimester {item.trimester})</p>
                        {item.status === 'reviewed' && (
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
                            <MessageSquare className="h-3 w-3 mr-1.5" />
                            Telah Ditinjau
                            </Badge>
                        )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge className={`capitalize ${badgeColorMap[item.anxiety_level]}`}>{getAnxietyLevelText(item.anxiety_level)}</Badge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    </div>
                ))}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default History;
