import { ArrowRight, Heart, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-maternal-light/20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
      <div className="absolute top-20 right-20 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float-animation"></div>
      <div className="absolute bottom-20 left-20 w-40 h-40 bg-maternal/10 rounded-full blur-3xl animate-gentle-bounce"></div>

      <div className="container px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in-up">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent border border-maternal/20">
                <Heart className="w-4 h-4 text-maternal mr-2" />
                <span className="text-sm font-medium text-foreground">
                  Skrining Kesehatan Ibu Hamil
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary to-maternal bg-clip-text text-transparent">
                  CalMyCare
                </span>
                <br />
                <span className="text-foreground">Merawat Anda &amp; Bayi</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Skrining kecemasan profesional dan dukungan edukasi untuk ibu
                baru. Ikuti penilaian GAD-7 dan akses sumber daya kesehatan ibu
                hamil yang dipersonalisasi.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="maternal"
                size="lg"
                onClick={() => navigate("/auth")}
              >
                Mulai Skrining
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <a href="/#about">
                <Button
                  variant="outline"
                  size="lg"
                  className="hover:bg-accent transition-smooth"
                >
                  Pelajari Lebih Lanjut
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-8 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">95%</div>
                <div className="text-sm text-muted-foreground">
                  Tingkat Akurasi
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-maternal">1000+</div>
                <div className="text-sm text-muted-foreground">
                  Ibu Terbantu
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">24/7</div>
                <div className="text-sm text-muted-foreground">Dukungan</div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div
            className="grid gap-6 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Card className="p-6 card-gradient shadow-soft hover:shadow-maternal transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">
                    Skrining GAD-7 Profesional
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Alat penilaian kecemasan yang divalidasi secara klinis dan
                    dirancang khusus untuk kesehatan ibu.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 card-gradient shadow-soft hover:shadow-maternal transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-maternal/10">
                  <Heart className="h-6 w-6 text-maternal" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">
                    Rencana Perawatan Pribadi
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Dapatkan rekomendasi dan materi edukasi yang disesuaikan
                    berdasarkan hasil skrining Anda.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 card-gradient shadow-soft hover:shadow-maternal transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">
                    Dasbor Penyedia Layanan Kesehatan
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Platform aman bagi penyedia layanan kesehatan untuk memantau
                    dan mendukung pasien mereka.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
