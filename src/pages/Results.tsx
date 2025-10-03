import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft, 
  Heart, 
  TrendingUp, 
  BookOpen, 
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  MessageSquare
} from 'lucide-react';

interface Screening {
  id: string;
  total_score: number;
  anxiety_level: 'minimal' | 'mild' | 'moderate' | 'severe';
  completed_at: string;
  status: 'in_progress' | 'completed' | 'reviewed';
  notes: string | null;
}

interface EducationalMaterial {
  id: string;
  title: string;
  content: string;
  material_type: string;
  image_url: string | null;
  video_url: string | null;
}

const getYouTubeThumbnail = (url: string | null) => {
  if (!url) return null;
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(youtubeRegex);
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return null;
};

export default function Results() {
  const { user, loading } = useAuth();
  const [screening, setScreening] = useState<Screening | null>(null);
  const [recommendations, setRecommendations] = useState<EducationalMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const screeningId = location.state?.screeningId;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user && screeningId) {
      fetchScreeningResult();
      fetchRecommendations();
    }
  }, [user, loading, screeningId, navigate]);

  const fetchScreeningResult = async () => {
    try {
      const { data, error } = await supabase
        .from('screenings')
        .select('*')
        .eq('id', screeningId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setScreening(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat hasil skrining",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  };

  const fetchRecommendations = async () => {
    try {
      if (!screening) return;

      const { data, error } = await supabase
        .from('educational_materials')
        .select('*')
        .eq('anxiety_level', screening.anxiety_level)
        .eq('is_published', true)
        .limit(3);

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getResultInfo = (level: string, score: number) => {
    switch (level) {
      case 'minimal':
        return {
          title: 'Kecemasan Minimal',
          description: 'Tingkat kecemasan Anda tergolong minimal. Ini adalah hasil yang baik!',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: CheckCircle,
          recommendation: 'Pertahankan gaya hidup sehat dan tetap waspada terhadap perubahan suasana hati.'
        };
      case 'mild':
        return {
          title: 'Kecemasan Ringan',
          description: 'Anda mengalami tingkat kecemasan yang ringan. Beberapa strategi sederhana dapat membantu.',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: Info,
          recommendation: 'Coba teknik relaksasi dan pertimbangkan untuk berbicara dengan tenaga kesehatan.'
        };
      case 'moderate':
        return {
          title: 'Kecemasan Sedang',
          description: 'Tingkat kecemasan Anda sedang dan memerlukan perhatian lebih lanjut.',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: AlertTriangle,
          recommendation: 'Disarankan untuk konsultasi dengan bidan atau tenaga kesehatan mental.'
        };
      case 'severe':
        return {
          title: 'Kecemasan Berat',
          description: 'Tingkat kecemasan Anda tergolong berat dan memerlukan bantuan profesional segera.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: AlertTriangle,
          recommendation: 'Segera konsultasikan dengan dokter atau psikolog untuk mendapatkan penanganan yang tepat.'
        };
      default:
        return {
          title: 'Hasil Tidak Diketahui',
          description: 'Terjadi kesalahan dalam memproses hasil.',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: Info,
          recommendation: 'Silakan hubungi tenaga kesehatan untuk konsultasi lebih lanjut.'
        };
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!screening) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Hasil skrining tidak ditemukan</p>
      </div>
    );
  }

  const resultInfo = getResultInfo(screening.anxiety_level, screening.total_score);
  const IconComponent = resultInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-bold text-primary">CalMyCare</h1>
                <p className="text-sm text-muted-foreground">Hasil Skrining</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Result Summary */}
        <Card className={`mb-8 ${resultInfo.bgColor} ${resultInfo.borderColor} border-2`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <IconComponent className={`h-8 w-8 ${resultInfo.color}`} />
              <div>
                <CardTitle className={`text-2xl ${resultInfo.color}`}>
                  {resultInfo.title}
                </CardTitle>
                <CardDescription className="text-lg text-foreground">
                  {resultInfo.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Skor GAD-7</span>
                  <span className="text-2xl font-bold">{screening.total_score}/21</span>
                </div>
                <Progress value={(screening.total_score / 21) * 100} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  Tanggal: {new Date(screening.completed_at).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex items-center">
                <div>
                  <h4 className="font-semibold mb-2">Rekomendasi:</h4>
                  <p className="text-sm">{resultInfo.recommendation}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Midwife's Review */}
        {screening.status === 'reviewed' && screening.notes && (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Tinjauan dari Bidan
              </CardTitle>
              <CardDescription>
                Berikut adalah catatan dan rekomendasi dari bidan berdasarkan hasil skrining Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-foreground">
                <p>{screening.notes}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Score Interpretation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Interpretasi Skor GAD-7</CardTitle>
            <CardDescription>
              Pemahaman tentang tingkat kecemasan berdasarkan skor yang Anda peroleh
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <h4 className="font-semibold text-green-800">Minimal</h4>
                <p className="text-sm text-green-700">0-4 poin</p>
                <p className="text-xs text-green-600 mt-1">Kecemasan rendah</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <h4 className="font-semibold text-yellow-800">Ringan</h4>
                <p className="text-sm text-yellow-700">5-9 poin</p>
                <p className="text-xs text-yellow-600 mt-1">Perlu perhatian</p>
              </div>
              <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                <h4 className="font-semibold text-orange-800">Sedang</h4>
                <p className="text-sm text-orange-700">10-14 poin</p>
                <p className="text-xs text-orange-600 mt-1">Butuh konsultasi</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <h4 className="font-semibold text-red-800">Berat</h4>
                <p className="text-sm text-red-700">15-21 poin</p>
                <p className="text-xs text-red-600 mt-1">Perlu bantuan segera</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Educational Materials */}
        {recommendations.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Materi Edukasi yang Direkomendasikan
              </CardTitle>
              <CardDescription>
                Materi pembelajaran yang sesuai dengan kondisi Anda saat ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((material) => (
                  <Card
                    key={material.id}
                    className="flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/education/${material.id}`)}
                  >
                    <CardHeader className="p-0">
                      <img 
                        src={
                          material.material_type === 'video' 
                            ? getYouTubeThumbnail(material.video_url) || 'https://via.placeholder.com/400x225?text=Video'
                            : material.image_url || 'https://via.placeholder.com/400x225?text=CalMyCare'
                        } 
                        alt={material.title} 
                        className="rounded-t-lg aspect-video object-cover"
                      />
                    </CardHeader>
                    <div className="p-4 flex flex-col flex-grow">
                      <CardTitle className="text-sm font-semibold leading-tight mb-2 line-clamp-2">{material.title}</CardTitle>
                      <div className="flex-grow" />
                      <CardFooter className="p-0 pt-2">
                        <Badge variant="secondary" className="text-xs">
                          {material.material_type}
                        </Badge>
                      </CardFooter>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            size="lg" 
            onClick={() => navigate('/education')}
            className="flex-1"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Lihat Materi Edukasi
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate('/screening')}
            className="flex-1"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Skrining Ulang
          </Button>
        </div>

        {/* Important Notice */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800 mb-1">Penting untuk Diingat</h4>
              <p className="text-sm text-amber-700">
                Hasil skrining ini bukan diagnosis medis. Jika Anda merasa khawatir tentang kondisi kesehatan mental Anda, 
                silakan konsultasikan dengan tenaga kesehatan profesional. Selalu prioritaskan kesehatan Anda dan janin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}