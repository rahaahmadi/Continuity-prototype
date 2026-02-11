import { motion } from "framer-motion";
import { Upload, MessageSquare, FileCheck, Share2 } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Externalize knowledge",
    description: "Our AI asks targeted questions about your business — operations, relationships, decision-making. Answer by text or voice.",
  },
  {
    icon: Upload,
    title: "Upload Documents",
    description: "Upload financial records, legal docs, tax filings, and operational documents. Our checklist guides you on what's needed.",
  },
  {
    icon: FileCheck,
    title: "Get Your Business Profile",
    description: "We generate comprehensive reports with insights, visualizations, and an organized document repository.",
  },
  {
    icon: Share2,
    title: "Share With Buyers",
    description: "Control what each buyer sees with tiered access. Buyers can explore your profile and ask questions.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-card">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Four steps to sale-ready
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A guided process that works around your schedule, not against it.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl gradient-gold flex items-center justify-center flex-shrink-0">
                  <step.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground font-sans mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-5 left-full w-8 h-px bg-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
