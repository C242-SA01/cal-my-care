import { BookOpen, Brain, CheckCircle, Heart, MessageSquare, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

const Features = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: 'Skrining PASS',
      description: 'Alat penilaian profesional dengan 31 pertanyaan yang telah tervalidasi untuk mendeteksi kecemasan pada ibu hamil.',
      color: 'primary',
    },
    {
      icon: Heart,
      title: 'E-Modul untuk Ibu Hamil',
      description: 'Rekomendasi materi terkait ibu primigravida dan kecemasan yang di alami.',
      color: 'maternal',
    },
    {
      icon: BookOpen,
      title: 'Video Edukasi',
      description: 'Rekomendasi video edukasi berupa terapi yang bisa dipakai ibu primigravida ketika mengalami kecemasan.',
      color: 'success',
    },
    {
      icon: CheckCircle,
      title: 'Kuis Interaktif',
      description: 'Skrining kecemasan ibu primigravida sesuai dengan trimester dan setelah pemakaian website.',
      color: 'primary',
    },
    {
      icon: Stethoscope,
      title: 'Care',
      description: 'Tampilan hasil skrining yang bisa ibu primigravida lihat setelah mengisi kuesioner skrining kecemasan.',
      color: 'maternal',
    },
    {
      icon: MessageSquare,
      title: 'Calmy',
      description: 'Menulis isi hati ibu primigravida atau keluhan yang bisa disampaikan melalui catatan harian CalMyCare',
      color: 'success',
    },
  ];

  const getIconStyle = (color: string) => {
    const styles = {
      primary: 'bg-primary/10 text-primary',
      maternal: 'bg-maternal/10 text-maternal',
      success: 'bg-success/10 text-success',
    };
    return styles[color as keyof typeof styles] || styles.primary;
  };

  return (
    <section id="about" className="py-20 bg-gradient-to-b from-background to-accent/20">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent border border-primary/20">
            <Heart className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm font-medium text-foreground">Platform Perawatan Lengkap</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-foreground">
            Dukungan Kesehatan Ibu
            <span className="bg-gradient-to-r from-primary to-maternal bg-clip-text text-transparent"> yang Komprehensif</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Dari skrining profesional hingga sumber daya pendidikan, CalMyCare menyediakan semua yang Anda butuhkan untuk manajemen kesehatan ibu yang percaya diri.</p>
        </div>

        {/* Features Grid */}
        <div id="education" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="card-gradient shadow-soft hover:shadow-maternal transition-all duration-300 border-0 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader className="space-y-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${getIconStyle(feature.color)}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div id="screening" className="mt-16 text-center">
          <Card className="inline-block p-8 card-gradient shadow-maternal border-0">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Siap Memulai Skrining Anda?</h3>
              <p className="text-muted-foreground max-w-md">Ambil langkah pertama menuju kesehatan ibu yang lebih baik dengan penilaian PASS profesional kami.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Button onClick={() => navigate('/auth')} size="lg" className="px-6 py-3 bg-gradient-maternal text-white rounded-lg font-medium shadow-maternal hover:shadow-glow transition-all duration-300">
                  Mulai Penilaian
                </Button>
                <a href="#about">
                  <Button size="lg" variant="outline" className="px-6 py-3 border-primary/20 text-foreground rounded-lg font-medium hover:bg-accent transition-smooth">
                    Pelajari Tentang PASS
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Features;
