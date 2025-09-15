import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section id="home">
          <Hero />
        </section>
        <Features />
        
        {/* Call to Action Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Siap Memulai Skrining Kesehatan Mental?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Bergabunglah dengan platform CallMyCare untuk mendapatkan dukungan kesehatan mental 
              yang Anda butuhkan selama kehamilan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth")}>
                Mulai Sekarang
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/auth")}>
                Masuk ke Akun
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
