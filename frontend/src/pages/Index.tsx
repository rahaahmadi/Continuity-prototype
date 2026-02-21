import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <Hero />
      <HowItWorks />
      <Features />
    </main>
    <Footer />
  </div>
);

export default Index;
