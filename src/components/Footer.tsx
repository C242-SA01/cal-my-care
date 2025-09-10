import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

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
                <h3 className="text-lg font-bold text-foreground">CallMyCare</h3>
                <p className="text-xs text-muted-foreground">Maternal Health Platform</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Professional anxiety screening and educational support for first-time mothers. 
              Your trusted partner in maternal health.
            </p>
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
            <h4 className="font-semibold text-foreground">Services</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">GAD-7 Screening</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Educational Resources</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Interactive Quizzes</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Provider Dashboard</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Personalized Care Plans</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Resources</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">About GAD-7</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Maternal Health Guide</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Support Groups</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Emergency Contacts</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">support@callmycare.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">+1 (555) 123-CARE</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Healthcare Center<br />123 Care Street</span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-accent border border-maternal/20">
              <p className="text-xs text-muted-foreground">
                <strong className="text-maternal">24/7 Crisis Support:</strong><br />
                If you're experiencing a mental health emergency, please contact your local emergency services immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2024 CallMyCare. All rights reserved. | Developed for maternal health screening and education.
          </div>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">HIPAA Compliance</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;