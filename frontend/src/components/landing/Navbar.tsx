import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-navy flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">C</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Continuity</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="text-muted-foreground">Sign In</Button>
          </Link>
          <Link to="/dashboard">
            <Button size="sm" className="gradient-gold text-accent-foreground shadow-gold hover:opacity-90 transition-opacity gap-1.5">
              Get Started <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
