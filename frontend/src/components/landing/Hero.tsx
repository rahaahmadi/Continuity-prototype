import { motion } from "framer-motion";
import { ArrowRight, Shield, Brain, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gold-light/30 via-background to-background" />
      
      <div className="container relative">
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-light text-gold-dark text-xs font-medium mb-6">
              <Shield className="h-3.5 w-3.5" />
              Trusted by 500+ business owners
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-[1.1] mb-6">
              Build <span className="text-gradient-gold">Confidence</span> in Your Business
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
              Turn your knowledge, documents, and operations into a clear, buyer-ready profile, before diligence begins.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <Link to="/register">
                <Button size="lg" className="gradient-gold text-accent-foreground shadow-gold hover:opacity-90 transition-opacity gap-2 text-base px-6">
                  Start Preparing <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="text-base px-6">
                  See How It Works
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-accent" />
                AI-powered extraction
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-accent" />
                Sale-ready reports
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
