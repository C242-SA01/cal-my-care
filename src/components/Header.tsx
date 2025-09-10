import { Heart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-maternal">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">CallMyCare</h1>
            <p className="text-xs text-muted-foreground">Maternal Health Screening</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#home" className="text-sm font-medium text-foreground hover:text-primary transition-smooth">
            Home
          </a>
          <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-smooth">
            About
          </a>
          <a href="#screening" className="text-sm font-medium text-muted-foreground hover:text-primary transition-smooth">
            Screening
          </a>
          <a href="#education" className="text-sm font-medium text-muted-foreground hover:text-primary transition-smooth">
            Education
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="hidden sm:flex">
            Login
          </Button>
          <Button variant="hero">
            Get Started
          </Button>
          
          {/* Mobile menu */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;