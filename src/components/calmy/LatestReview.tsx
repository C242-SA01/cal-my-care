import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader2, MessageSquare, Info, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// This interface must match the one in CarePage.tsx
interface ScreeningHistoryItem {
  id: string;
  screening_type: string;
  total_score: number;
  anxiety_level: 'normal' | 'ringan' | 'sedang' | 'berat';
  completed_at: string;
  status: 'completed' | 'reviewed';
  notes: string | null;
  reviewed_at: string | null;
}

export function LatestReview() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchHistory = async () => {
    const { data, error } = await supabase.rpc('get_screening_history');
    if (error) throw new Error(error.message);
    return data as ScreeningHistoryItem[];
  };

  const { data: historyData, isLoading } = useQuery<ScreeningHistoryItem[]>({
    queryKey: ['screeningHistory_v3', user?.id], // Use the same key to leverage caching
    queryFn: fetchHistory,
    enabled: !!user,
  });

  const latestReviewedItem = historyData
    ?.filter(item => item.status === 'reviewed' && item.notes)
    .sort((a, b) => new Date(b.reviewed_at!).getTime() - new Date(a.reviewed_at!).getTime())[0];

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-3/4 bg-muted-foreground/20 rounded"></div>
          <div className="h-4 w-1/2 bg-muted-foreground/20 rounded mt-2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-10 w-full bg-muted-foreground/20 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!latestReviewedItem) {
    // Render nothing if there are no reviews, to keep the dashboard clean.
    // An alternative is to show a placeholder card.
    return null;
  }

  return (
    <Card 
      className="bg-pink-50 border-pink-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate('/results', { state: { screeningId: latestReviewedItem.id } })}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-pink-900">
          <MessageSquare className="h-5 w-5" />
          Tinjauan Baru dari Admin
        </CardTitle>
        <CardDescription>
          Admin telah memberikan catatan untuk hasil skrining Anda pada tanggal {' '}
          {new Date(latestReviewedItem.completed_at).toLocaleDateString('id-ID', { month: 'long', day: 'numeric' })}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <blockquote className="text-sm text-slate-700 italic border-l-4 border-pink-300 pl-4 py-1">
          {latestReviewedItem.notes}
        </blockquote>
        <div className="flex justify-between items-center mt-4">
            <Badge variant="secondary">Lihat Detail</Badge>
            <ChevronRight className="h-5 w-5 text-slate-500" />
        </div>
      </CardContent>
    </Card>
  );
}
