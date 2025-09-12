import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, FileBarChart, TrendingUp, AlertTriangle } from "lucide-react";
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

interface Stats {
  totalPatients: number;
  totalScreenings: number;
  anxietyDistribution: {
    minimal: number;
    mild: number;
    moderate: number;
    severe: number;
  };
  recentTrends: Array<{
    month: string;
    count: number;
  }>;
}

const ANXIETY_COLORS = {
  minimal: "#10B981", // green
  mild: "#F59E0B",    // yellow
  moderate: "#F97316", // orange
  severe: "#EF4444",   // red
};

const AdminStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch total patients
      const { count: totalPatients } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "patient");

      // Fetch total screenings
      const { count: totalScreenings } = await supabase
        .from("screenings")
        .select("*", { count: "exact", head: true });

      // Fetch anxiety level distribution
      const { data: anxietyData } = await supabase
        .from("screenings")
        .select("anxiety_level")
        .eq("status", "completed")
        .not("anxiety_level", "is", null);

      const anxietyDistribution = {
        minimal: 0,
        mild: 0,
        moderate: 0,
        severe: 0,
      };

      anxietyData?.forEach((item) => {
        if (item.anxiety_level in anxietyDistribution) {
          anxietyDistribution[item.anxiety_level as keyof typeof anxietyDistribution]++;
        }
      });

      // Fetch recent trends (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: trendsData } = await supabase
        .from("screenings")
        .select("created_at")
        .gte("created_at", sixMonthsAgo.toISOString());

      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
      ];

      const trendsMap = new Map();
      trendsData?.forEach((item) => {
        const date = new Date(item.created_at);
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        trendsMap.set(monthKey, (trendsMap.get(monthKey) || 0) + 1);
      });

      const recentTrends = Array.from(trendsMap.entries()).map(([month, count]) => ({
        month,
        count: count as number,
      }));

      setStats({
        totalPatients: totalPatients || 0,
        totalScreenings: totalScreenings || 0,
        anxietyDistribution,
        recentTrends,
      });
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
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
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

  const totalAnxietyScreenings = Object.values(stats.anxietyDistribution).reduce((a, b) => a + b, 0);
  const highRiskPercentage = totalAnxietyScreenings > 0 
    ? ((stats.anxietyDistribution.moderate + stats.anxietyDistribution.severe) / totalAnxietyScreenings) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pasien</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Ibu hamil terdaftar</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Skrining</CardTitle>
            <FileBarChart className="h-4 w-4 text-maternal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-maternal">{stats.totalScreenings}</div>
            <p className="text-xs text-muted-foreground">Skrining dilakukan</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Kompletion</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {stats.totalScreenings > 0 ? Math.round((totalAnxietyScreenings / stats.totalScreenings) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Skrining selesai</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risiko Tinggi</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{Math.round(highRiskPercentage)}%</div>
            <p className="text-xs text-muted-foreground">Memerlukan perhatian</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anxiety Distribution Pie Chart */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Distribusi Tingkat Kecemasan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trends Bar Chart */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Tren Skrining (6 Bulan Terakhir)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.recentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStats;