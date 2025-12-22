import { Heart, AlertTriangle, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-background to-accent/10 border-t">
      <div className="container px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-maternal">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">CalMyCare</h3>
                <p className="text-xs text-muted-foreground">Platform Kesehatan Ibu Hamil Primigravida</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">Skrining kecemasan profesional dan dukungan edukasi untuk ibu baru. Mitra terpercaya Anda dalam kesehatan ibu.</p>
            <div className="flex space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <Facebook className="h-4 w-4 text-primary" />
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <Twitter className="h-4 w-4 text-primary" />
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                <Instagram className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Layanan</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Skrining PASS
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  E-Modul
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Video Edukasi
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Kuis Interaktif
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Care
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Calmy
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Sumber Daya</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Tentang PASS
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Panduan Kesehatan Ibu
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Grup Dukungan
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Kontak Darurat
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Kebijakan Privasi
                </a>
              </li>
            </ul>
          </div>

          {/* Important Warning */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Peringatan Penting</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <span>
                  Informasi di platform ini adalah untuk tujuan skrining dan edukasi, bukan pengganti nasihat, diagnosis, atau perawatan medis profesional.
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <Heart className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  Selalu konsultasikan dengan dokter atau penyedia layanan kesehatan Anda yang terkualifikasi untuk pertanyaan apa pun yang mungkin Anda miliki mengenai kondisi medis.
                </span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-muted-foreground">
                <strong className="text-destructive">Dukungan Krisis 24/7:</strong>
                <br />
                Jika Anda mengalami keadaan darurat kesehatan mental, harap segera hubungi layanan darurat setempat atau profesional kesehatan mental.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">© 2024 CalMyCare. Hak cipta dilindungi. | Dikembangkan untuk skrining dan edukasi kesehatan ibu.</div>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Ketentuan Layanan
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Kebijakan Privasi
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Kepatuhan HIPAA
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
