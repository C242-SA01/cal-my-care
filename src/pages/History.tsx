import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, Loader2, AlertTriangle, FileText, ChevronRight, MessageSquare } from "lucide-react";

interface ScreeningHistory {
  id: string;
  completed_at: string;
  total_score: number;
  anxiety_level: 'minimal' | 'mild' | 'moderate' | 'severe';
  status: 'completed' | 'reviewed';
  notes: string | null;
}

const badgeColorMap: { [key: string]: string } = {
  minimal: 'bg-green-100 text-green-800 hover:bg-green-200',
  mild: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  moderate: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  severe: 'bg-red-100 text-red-800 hover:bg-red-200',
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
          .from("screenings")
          .select("id, completed_at, total_score, anxiety_level, status, notes")
          .eq("user_id", user.id)
          .in("status", ["completed", "reviewed"])
          .order("completed_at", { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (error) {
        console.error("Error fetching screening history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const handleViewResult = (screeningId: string) => {
    navigate("/results", { state: { screeningId } });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HistoryIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Riwayat Hasil Skrining</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <HistoryCardSkeleton key={i} />)}
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Belum Ada Riwayat</h2>
          <p className="text-muted-foreground mt-2 max-w-sm">Anda belum pernah menyelesaikan skrining. Mulai skrining pertama Anda untuk melihat hasilnya di sini.</p>
          <Button onClick={() => navigate("/screening")} className="mt-6">
            <FileText className="h-4 w-4 mr-2" />
            Mulai Skrining Sekarang
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleViewResult(item.id)}
                >
                  <div>
                    <p className="font-semibold">
                      {new Date(item.completed_at).toLocaleDateString("id-ID", {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">Skor: {item.total_score} / 21</p>
                      {item.status === 'reviewed' && (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
                          <MessageSquare className="h-3 w-3 mr-1.5" />
                          Telah Ditinjau
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={`capitalize ${badgeColorMap[item.anxiety_level]}`}>
                      {item.anxiety_level}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default History;