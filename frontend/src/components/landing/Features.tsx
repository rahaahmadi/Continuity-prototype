import { motion } from "framer-motion";
import { Brain, Lock, BarChart3, FolderOpen, MessageCircle, Eye } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Knowledge Extraction",
    description: "Conversational AI captures the operational knowledge only you know — processes, relationships, decision logic.",
  },
  {
    icon: FolderOpen,
    title: "Document Organization",
    description: "Uploaded documents are automatically classified and organized into a structured, searchable repository.",
  },
  {
    icon: BarChart3,
    title: "Generated Insights",
    description: "Visual reports with charts, tables, and metrics that tell the story of your business clearly.",
  },
  {
    icon: Lock,
    title: "Tiered Access Control",
    description: "Share at three levels — Business Overview, NDA Operations, and Full Financials — you control what each buyer sees.",
  },
  {
    icon: MessageCircle,
    title: "Q&A",
    description: "Buyers can ask questions about your business profile, and get AI-powered answers grounded in your data.",
  },
  {
    icon: Eye,
    title: "Sale Readiness Score",
    description: "Track your preparation progress with a real-time readiness score and actionable next steps.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-sans font-bold text-foreground mb-4">
            Everything you need to prepare
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Built specifically for business owners who want to maximize their exit value.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group p-6 rounded-xl border border-border bg-card hover:shadow-elevated transition-all duration-300"
            >
              <div className="h-10 w-10 rounded-lg bg-gold-light flex items-center justify-center mb-4 group-hover:shadow-gold transition-shadow">
                <feature.icon className="h-5 w-5 text-gold-dark" />
              </div>
              <h3 className="text-base font-semibold text-foreground font-sans mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
