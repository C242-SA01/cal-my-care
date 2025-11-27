import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calendar, User, Baby, Download, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

interface PatientDetailProps {
  patient: {
    id: string;
    full_name: string | null;
    email: string | null;
    gestational_age: number | null;
    is_primigravida: boolean | null;
    created_at: string;
  };
}

interface Screening {
  id: string;
  total_score: number | null;
  anxiety_level: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  notes: string | null;
}

interface Answer {
  question_id: string;
  score: number;
  question_text: string;
}

const PatientDetail = ({ patient }: PatientDetailProps) => {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreening, setSelectedScreening] = useState<Screening | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);

  useEffect(() => {
    fetchScreeningHistory();
  }, [patient.id]);

  const fetchScreeningHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("screenings")
        .select("*")
        .eq("user_id", patient.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setScreenings(data || []);
    } catch (error) {
      console.error("Error fetching screening history:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScreeningAnswers = async (screeningId: string) => {
    try {
      const { data, error } = await supabase
        .from("screening_answers")
        .select(`
          question_id,
          score,
          gad7_questions!inner(question_text)
        `)
        .eq("screening_id", screeningId)
        .order("question_id", { ascending: true });

      if (error) throw error;

      const formattedAnswers = data?.map((item: any) => ({
        question_id: item.question_id,
        score: item.score,
        question_text: item.gad7_questions.question_text,
      })) || [];

      setAnswers(formattedAnswers);
    } catch (error) {
      console.error("Error fetching screening answers:", error);
    }
  };

  const getAnxietyText = (level: string | null) => {
    switch (level) {
      case "minimal":
        return "Minimal";
      case "mild":
        return "Ringan";
      case "moderate":
        return "Sedang";
      case "severe":
        return "Berat";
      default:
        return "Belum ada";
    }
  };

  const getAnxietyColor = (level: string | null) => {
    switch (level) {
      case "minimal":
        return "hsl(var(--success))";
      case "mild":
        return "hsl(var(--warning))";
      case "moderate":
        return "hsl(var(--destructive))";
      case "severe":
        return "hsl(var(--destructive))";
      default:
        return "hsl(var(--muted-foreground))";
    }
  };

  const chartData = screenings
    .filter(s => s.status === "completed" && s.total_score !== null)
    .map(screening => ({
      date: format(parseISO(screening.created_at), "dd/MM", { locale: id }),
      skor: screening.total_score,
      level: screening.anxiety_level,
    }));

  const exportPatientReport = () => {
    const reportContent = [
      `LAPORAN PASIEN - ${patient.full_name}`,
      `Tanggal: ${format(new Date(), "dd MMMM yyyy", { locale: id })}`,
      "",
      "=== INFORMASI PASIEN ===",
      `Nama: ${patient.full_name || "-"}`,
      `Email: ${patient.email || "-"}`,
      `Usia Kehamilan: ${patient.gestational_age ? `${patient.gestational_age} minggu` : "-"}`,
      `Primigravida: ${patient.is_primigravida ? "Ya" : "Tidak"}`,
      `Tanggal Daftar: ${format(parseISO(patient.created_at), "dd MMMM yyyy", { locale: id })}`,
      "",
      "=== RIWAYAT SKRINING ===",
      ...screenings.map((screening, index) => [
        `${index + 1}. Tanggal: ${format(parseISO(screening.created_at), "dd MMMM yyyy HH:mm", { locale: id })}`,
        `   Status: ${screening.status === "completed" ? "Selesai" : "Belum Selesai"}`,
        `   Skor: ${screening.total_score || "-"}`,
        `   Tingkat Kecemasan: ${getAnxietyText(screening.anxiety_level)}`,
        `   Catatan: ${screening.notes || "-"}`,
        ""
      ]).flat(),
    ].join("\n");

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-${patient.full_name?.replace(/\s+/g, "-") || "pasien"}-${format(new Date(), "yyyy-MM-dd")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient Info */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Pasien
            </CardTitle>
            <Button onClick={exportPatientReport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Laporan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nama Lengkap</p>
              <p className="font-medium">{patient.full_name || "Tidak ada nama"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{patient.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Usia Kehamilan</p>
              <p className="font-medium flex items-center gap-2">
                <Baby className="h-4 w-4" />
                {patient.gestational_age ? `${patient.gestational_age} minggu` : "Belum diisi"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tanggal Daftar</p>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(parseISO(patient.created_at), "dd MMMM yyyy", { locale: id })}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Status Kehamilan</p>
              <Badge variant="outline">
                {patient.is_primigravida ? "Primigravida (Kehamilan Pertama)" : "Multigravida"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screening History Chart */}
      {chartData.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Grafik Riwayat Skor Kecemasan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 21]} />
                <Tooltip 
                  labelFormatter={(label) => `Tanggal: ${label}`}
                  formatter={(value: any, name: string) => [
                    `${value} (${getAnxietyText(chartData.find(d => d.skor === value)?.level || null)})`,
                    "Skor GAD-7"
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="skor" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Screening History */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Riwayat Skrining ({screenings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {screenings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Belum ada skrining yang dilakukan</p>
          ) : (
            <div className="space-y-4">
              {screenings.map((screening, index) => (
                <div key={screening.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">Skrining #{screenings.length - index}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(screening.created_at), "dd MMMM yyyy HH:mm", { locale: id })}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={screening.status === "completed" ? "default" : "secondary"}>
                        {screening.status === "completed" ? "Selesai" : "Belum Selesai"}
                      </Badge>
                    </div>
                  </div>
                  
                  {screening.status === "completed" && (
                    <>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Skor</p>
                          <p className="font-medium">{screening.total_score}/21</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tingkat Kecemasan</p>
                          <Badge 
                            variant="outline"
                            style={{ 
                              color: getAnxietyColor(screening.anxiety_level),
                              borderColor: getAnxietyColor(screening.anxiety_level)
                            }}
                          >
                            {getAnxietyText(screening.anxiety_level)}
                          </Badge>
                        </div>
                      </div>
                      
                      {screening.notes && (
                        <>
                          <Separator className="my-2" />
                          <div>
                            <p className="text-sm text-muted-foreground">Catatan</p>
                            <p className="text-sm">{screening.notes}</p>
                          </div>
                        </>
                      )}
                      
                      <Separator className="my-2" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedScreening(screening);
                          fetchScreeningAnswers(screening.id);
                        }}
                      >
                        Lihat Detail Jawaban
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Screening Answers Modal */}
      {selectedScreening && answers.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>
              Detail Jawaban Skrining - {format(parseISO(selectedScreening.created_at), "dd MMMM yyyy", { locale: id })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {answers.map((answer, index) => (
                <div key={answer.question_id} className="border-l-2 border-primary/20 pl-4">
                  <p className="text-sm font-medium mb-1">
                    {index + 1}. {answer.question_text}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Skor: <span className="font-medium">{answer.score}</span>
                  </p>
                </div>
              ))}
              <Separator className="my-4" />
              <div className="bg-muted/50 p-3 rounded">
                <p className="text-sm font-medium">
                  Total Skor: {selectedScreening.total_score}/21 - {getAnxietyText(selectedScreening.anxiety_level)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatientDetail;