import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileBarChart, AlertTriangle, CheckCircle2, ListChecks } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

// --- INTERFACE DEFINITIONS ---
interface Stats {
  totalPatients: number;
  totalScreenings: number;
  anxietyDistribution: {
    minimal: number; mild: number; moderate: number; severe: number;
  };
  recentTrends: Array<{ month: string; count: number; }>;
}

interface HighRiskPatient {
  id: string;
  full_name: string | null;
}

interface RecentActivity {
  patientName: string | null;
  adminName: string | null;
  reviewedAt: string;
}

const ANXIETY_COLORS = {
  minimal: "#10B981",
  mild: "#F59E0B",
  moderate: "#F97316",
  severe: "#EF4444",
};

// --- MAIN COMPONENT ---
const AdminStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [highRiskPatients, setHighRiskPatients] = useState<HighRiskPatient[]>([]);
  const [totalHighRiskCount, setTotalHighRiskCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // --- BASIC STATS ---
      const { count: totalPatients } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "patient");
      const { count: totalScreenings } = await supabase.from("screenings").select("*", { count: "exact", head: true });

      // --- ANXIETY DISTRIBUTION ---
      const { data: anxietyData } = await supabase.from("screenings").select("anxiety_level").eq("status", "completed").not("anxiety_level", "is", null);
      const anxietyDistribution = { minimal: 0, mild: 0, moderate: 0, severe: 0 };
      anxietyData?.forEach(item => {
        if (item.anxiety_level in anxietyDistribution) {
          anxietyDistribution[item.anxiety_level as keyof typeof anxietyDistribution]++;
        }
      });

      // --- RECENT TRENDS ---
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { data: trendsData } = await supabase.from("screenings").select("created_at").gte("created_at", sixMonthsAgo.toISOString());
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const trendsMap = new Map();
      trendsData?.forEach(item => {
        const date = new Date(item.created_at);
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        trendsMap.set(monthKey, (trendsMap.get(monthKey) || 0) + 1);
      });
      const recentTrends = Array.from(trendsMap.entries()).map(([month, count]) => ({ month, count: count as number }));

      // --- HIGH-RISK PATIENTS (NEEDS REVIEW) ---
      const { data: highRiskScreenings, error: screeningsError } = await supabase.from('screenings').select('user_id').in('anxiety_level', ['moderate', 'severe']).eq('status', 'completed');
      if (screeningsError) throw screeningsError;
      const uniqueHighRiskIds = [...new Set(highRiskScreenings.map(s => s.user_id))];
      setTotalHighRiskCount(uniqueHighRiskIds.length);

      if (uniqueHighRiskIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('id, full_name').in('id', uniqueHighRiskIds.slice(0, 5));
        if (profilesError) throw profilesError;
        setHighRiskPatients(profilesData || []);
      } else {
        setHighRiskPatients([]);
      }

      // --- RECENTLY REVIEWED ACTIVITIES ---
      const { data: reviewedData, error: reviewedError } = await supabase.from('screenings').select('user_id, reviewed_by, reviewed_at').eq('status', 'reviewed').not('reviewed_by', 'is', null).order('reviewed_at', { ascending: false }).limit(3);
      if (reviewedError) throw reviewedError;

      if (reviewedData && reviewedData.length > 0) {
        const allProfileIds = [...new Set([...reviewedData.map(r => r.user_id), ...reviewedData.map(r => r.reviewed_by)])];
        const { data: activityProfiles, error: activityProfilesError } = await supabase.from('profiles').select('id, full_name').in('id', allProfileIds);
        if (activityProfilesError) throw activityProfilesError;
        const profilesMap = new Map(activityProfiles.map(p => [p.id, p.full_name]));
        const activities = reviewedData.map(r => ({
          patientName: profilesMap.get(r.user_id) || 'Pasien',
          adminName: profilesMap.get(r.reviewed_by) || 'Bidan',
          reviewedAt: r.reviewed_at,
        }));
        setRecentActivities(activities);
      }

      setStats({ totalPatients: totalPatients || 0, totalScreenings: totalScreenings || 0, anxietyDistribution, recentTrends });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-4 bg-muted rounded w-3/4 mb-4"></div><div className="h-8 bg-muted rounded w-1/2"></div></CardContent></Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const pieData = [
    { name: "Minimal", value: stats.anxietyDistribution.minimal, fill: ANXIETY_COLORS.minimal },
    { name: "Ringan", value: stats.anxietyDistribution.mild, fill: ANXIETY_COLORS.mild },
    { name: "Sedang", value: stats.anxietyDistribution.moderate, fill: ANXIETY_COLORS.moderate },
    { name: "Berat", value: stats.anxietyDistribution.severe, fill: ANXIETY_COLORS.severe },
  ];

  const highRiskPercentage = stats.totalPatients > 0 ? (totalHighRiskCount / stats.totalPatients) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-soft"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Pasien</CardTitle><Users className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{stats.totalPatients}</div><p className="text-xs text-muted-foreground">Ibu hamil terdaftar</p></CardContent></Card>
        <Card className="shadow-soft"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Skrining</CardTitle><FileBarChart className="h-4 w-4 text-maternal" /></CardHeader><CardContent><div className="text-2xl font-bold text-maternal">{stats.totalScreenings}</div><p className="text-xs text-muted-foreground">Skrining dilakukan</p></CardContent></Card>
        
        {/* --- High-Risk Patients Card --- */}
        <Card className="shadow-soft border-warning/50"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pasien Perlu Perhatian</CardTitle><AlertTriangle className="h-4 w-4 text-warning" /></CardHeader><CardContent>
            <div className="text-2xl font-bold text-warning">{totalHighRiskCount} <span className="text-base font-normal text-muted-foreground">({highRiskPercentage.toFixed(0)}%)</span></div>
            {highRiskPatients.length > 0 ? (
              <div className="space-y-2 mt-1">
                <p className="text-xs text-muted-foreground">5 pasien teratas yang perlu ditinjau:</p>
                <ul className="space-y-1">
                  {highRiskPatients.map(p => (<li key={p.id} className="text-sm font-medium flex items-center"><Users className="h-4 w-4 mr-2 text-primary"/>{p.full_name}</li>))}
                </ul>
                <Button className="w-full mt-2" size="sm" variant="outline" onClick={() => navigate("/admin/results?status=completed")}>Tinjau Semua</Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Kerja bagus! Tidak ada pasien yang memerlukan tinjauan segera.</p>
            )}
        </CardContent></Card>

        {/* --- Recent Activity Card --- */}
        <Card className="shadow-soft"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Aktivitas Tinjauan Terakhir</CardTitle><ListChecks className="h-4 w-4 text-success" /></CardHeader><CardContent>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="text-xs">
                  <p className="font-medium truncate">{activity.patientName}</p>
                  <p className="text-muted-foreground">Ditinjau oleh <span className="font-semibold">{activity.adminName}</span> {formatDistanceToNow(new Date(activity.reviewedAt), { addSuffix: true, locale: id })}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-muted-foreground text-center py-4">Belum ada aktivitas tinjauan.</p>
            </div>
          )}
        </CardContent></Card>

      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-soft"><CardHeader><CardTitle>Distribusi Tingkat Kecemasan</CardTitle></CardHeader><CardContent>
            <ResponsiveContainer width="100%" height={300}><PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart></ResponsiveContainer>
        </CardContent></Card>

        <Card className="shadow-soft"><CardHeader><CardTitle>Tren Skrining (6 Bulan Terakhir)</CardTitle></CardHeader><CardContent>
            <ResponsiveContainer width="100%" height={300}><BarChart data={stats.recentTrends}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart></ResponsiveContainer>
        </CardContent></Card>
      </div>
    </div>
  );
};

export default AdminStats;