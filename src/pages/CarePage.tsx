import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ServerCrash, Frown, BarChart, LineChart as LineChartIcon, FileText, ChevronRight, MessageSquare, History as HistoryIcon, AlertTriangle } from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';


// --- Data Structures ---
interface ScreeningHistoryItem {
  id: string; // Added id for navigation
  screening_type: string;
  total_score: number;
  anxiety_level: 'normal' | 'ringan' | 'sedang' | 'berat';
  completed_at: string;
}

const levelToNumberMapping: { [key: string]: number } = {
  normal: 0,
  ringan: 1,
  sedang: 2,
  berat: 3,
};
const numberToLevelMapping = ['Normal', 'Ringan', 'Sedang', 'Berat'];

// --- Helper Functions for List ---
const badgeColorMap: { [key: string]: string } = {
  normal: 'bg-green-100 text-green-800 hover:bg-green-200',
  ringan: 'bg-green-100 text-green-800 hover:bg-green-200',
  sedang: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  berat: 'bg-red-100 text-red-800 hover:bg-red-200',
};

const getAnxietyLevelText = (level: string | null) => {
  if (!level) return 'Belum Selesai';
  if (level === 'ringan') return 'Cemas Ringan';
  if (level === 'sedang') return 'Cemas Sedang';
  if (level === 'berat') return 'Cemas Berat';
  return level.charAt(0).toUpperCase() + level.slice(1); // For 'Normal'
};

const getQuizTypeText = (type: string) => {
  switch (type) {
    case 'pretest': return 'Pre-Test';
    case 'post_test': return 'Post Test';
    case 'trimester_1': return 'Trimester 1';
    case 'trimester_2': return 'Trimester 2';
    case 'trimester_3': return 'Trimester 3';
    default: return 'Skrining';
  }
}

const CarePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- Data Fetching ---
  const fetchHistory = async () => {
    // The V2 RPC now returns all necessary columns, including 'id'.
    // The call should be simple, without a 'select' parameter.
    const { data, error } = await supabase.rpc('get_screening_history');
    
    if (error) {
      // The error "Could not find the function..." originates from here.
      // This new call is correct and should resolve it.
      throw new Error(error.message);
    }
    return data as ScreeningHistoryItem[];
  };

  const { data: historyData, isLoading, isError, error } = useQuery<ScreeningHistoryItem[]>({
    queryKey: ['screeningHistory_v2', user?.id], // Updated queryKey to prevent caching issues
    queryFn: fetchHistory,
    enabled: !!user,
  });

  // --- Data Processing for Charts ---
  const { prePostData, trimesterData } = useMemo(() => {
    if (!historyData) return { prePostData: [], trimesterData: [] };

    // Process for Chart 1: Pre-Test vs Post-Test
    const preTestResult = historyData.find(item => item.screening_type === 'pretest');
    const postTestResult = historyData.find(item => item.screening_type === 'post_test');
    
    const prePost = [];
    if (preTestResult) {
      prePost.push({ name: 'Pre-Test', level: levelToNumberMapping[preTestResult.anxiety_level] ?? 0 });
    }
    if (postTestResult) {
      prePost.push({ name: 'Post-Test', level: levelToNumberMapping[postTestResult.anxiety_level] ?? 0 });
    }
    // If only one is present, still show it. If none, array is empty.

    // Process for Chart 2: Trimester Trend
    const trimesterMap = new Map<string, ScreeningHistoryItem>();
    historyData.forEach(item => {
      if (item.screening_type.startsWith('trimester_')) {
        // Only take the latest completed quiz for each trimester
        const existing = trimesterMap.get(item.screening_type);
        if (!existing || new Date(item.completed_at) > new Date(existing.completed_at)) {
          trimesterMap.set(item.screening_type, item);
        }
      }
    });

    const trimesters = Array.from(trimesterMap.values())
      .sort((a, b) => { // Sort by trimester number
        const numA = parseInt(a.screening_type.split('_')[1]);
        const numB = parseInt(b.screening_type.split('_')[1]);
        return numA - numB;
      })
      .map(item => ({
        name: `T${item.screening_type.split('_')[1]}`,
        skor: item.total_score,
      }));

    return { prePostData: prePost, trimesterData: trimesters };
  }, [historyData]);


  // --- UI Render States ---
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[60vh] text-center">
        <Loader2 className="h-10 w-10 animate-spin text-pink-500 mb-4" />
        <p className="text-lg font-medium text-slate-700">Memuat Grafik Perkembangan...</p>
        <p className="text-sm text-slate-500">Menyusun riwayat skrining Bunda.</p>
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
            Terjadi kesalahan saat mengambil riwayat skrining. Silakan coba lagi nanti.
            <p className="text-xs mt-2 font-mono">Detail: {error instanceof Error ? error.message : 'Unknown error'}</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Helper for skeleton
  const HistoryCardSkeleton = () => (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50 animate-pulse">
      <div className="space-y-2">
        <div className="h-5 w-32 bg-muted-foreground/20 rounded"></div>
        <div className="h-4 w-24 bg-muted-foreground/20 rounded"></div>
      </div>
      <div className="h-8 w-20 bg-muted-foreground/20 rounded-full"></div>
    </div>
  );


  // --- Main Component Render ---
  return (
    <div className="p-4 md:p-6 space-y-8 bg-pink-50/20 min-h-screen">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-slate-800">Perkembangan Kondisi Bunda</h1>
        <p className="text-md text-slate-500 mt-2">Lihat rangkuman hasil skrining Bunda dari waktu ke waktu.</p>
      </header>
      
      {/* Charts Section */}
      {(prePostData.length > 0 || trimesterData.length > 0) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Pre-Post Test Comparison */}
          {prePostData.length > 0 && (
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg shadow-pink-100/50">
              <h3 className="font-semibold text-lg text-slate-700 mb-1 flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-pink-500" />
                Perubahan Tingkat Kecemasan
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={prePostData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    type="number" 
                    domain={[0, 3]} 
                    ticks={[0, 1, 2, 3]} 
                    tickFormatter={(value) => numberToLevelMapping[value]} 
                    stroke="#a1a1aa" 
                    fontSize={12} 
                  />
                  <Tooltip cursor={{ fill: '#fce7f3' }} contentStyle={{ backgroundColor: 'white', borderRadius: '0.75rem', borderColor: '#fce7f3' }} />
                  <Bar dataKey="level" fill="#f472b6" radius={[8, 8, 0, 0]}>
                    <LabelList dataKey="level" position="top" formatter={(value: number) => numberToLevelMapping[value]} fontSize={12} />
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
              <p className="text-sm text-center text-slate-500 mt-3 px-4">
                Grafik ini membantu Bunda melihat perubahan kondisi dari sebelum dan sesudah menggunakan CalMyCare.
              </p>
            </div>
          )}

          {/* Chart 2: Trimester Trend */}
          {trimesterData.length > 0 && (
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg shadow-pink-100/50">
              <h3 className="font-semibold text-lg text-slate-700 mb-1 flex items-center">
                <LineChartIcon className="h-5 w-5 mr-2 text-pink-500" />
                Tren Skor Antar Trimester
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={trimesterData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 93]} stroke="#a1a1aa" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '0.75rem', borderColor: '#fce7f3' }} />
                  <Line type="monotone" dataKey="skor" stroke="#ec4899" strokeWidth={3} activeDot={{ r: 8 }} dot={{ r: 6 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
              <p className="text-sm text-center text-slate-500 mt-3 px-4">
                Setiap titik menunjukkan skormu, membantu melihat tren kondisi di tiap tahap kehamilan.
              </p>
            </div>
          )}
        </div>
      ) : (
        // No chart data, but history data might still exist (e.g., only pretest, not posttest yet)
        // or historyData.length === 0 implies no data
        null
      )}

      {/* --- Full History List --- */}
      <Card className="bg-white p-0 rounded-2xl shadow-lg shadow-pink-100/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <HistoryIcon className="h-5 w-5" />
            Riwayat Lengkap Skrining
          </CardTitle>
          <p className="text-sm text-slate-500">Daftar semua skrining yang telah Bunda lakukan.</p>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-4">
              {[...Array(3)].map((_, i) => (
                <HistoryCardSkeleton key={i} />
              ))}
            </div>
          ) : historyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <AlertTriangle className="h-12 w-12 text-slate-400 mb-4" />
              <h2 className="text-xl font-semibold text-slate-700">Belum Ada Riwayat Skrining</h2>
              <p className="text-slate-500 mt-2 max-w-sm">Mulai skrining pertama Bunda di menu "Quiz" untuk melihat riwayat lengkapnya di sini.</p>
              <Button onClick={() => navigate('/quiz')} className="mt-6">
                <FileText className="h-4 w-4 mr-2" />
                Mulai Skrining Sekarang
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {historyData.slice().reverse().map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-4 hover:bg-pink-50/50 cursor-pointer transition-colors" 
                  onClick={() => navigate('/results', { state: { screeningId: item.id } })}
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {new Date(item.completed_at).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-slate-500">
                        Skor: {item.total_score} / 93 ({getQuizTypeText(item.screening_type)})
                      </p>
                      {/* Assuming 'reviewed' status would come from the item if applicable */}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={`capitalize ${badgeColorMap[item.anxiety_level]}`}>
                      {getAnxietyLevelText(item.anxiety_level)}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
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

export default CarePage;

// Helper for skeleton - re-added as it was removed in previous replace
const HistoryCardSkeleton = () => (
  <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white animate-pulse rounded-lg">
    <div className="space-y-2">
      <div className="h-5 w-48 bg-slate-200 rounded"></div>
      <div className="h-4 w-36 bg-slate-200 rounded"></div>
    </div>
    <div className="h-8 w-24 bg-slate-200 rounded-full"></div>
  </div>
);
