import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
}

interface QAChatProps {
  isOpen: boolean;
  onClose?: () => void;
  userType?: "seller" | "buyer";
  variant?: "floating" | "embedded";
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm here to answer any questions you have about this business profile. What would you like to know?",
  },
];

const QAChat = ({ isOpen, onClose, userType = "seller", variant = "floating" }: QAChatProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulated AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        revenue: "Based on the financial data, the business generated $2.4M in revenue over the trailing twelve months, with consistent month-over-month growth averaging 6.2%. The strongest performance was in Q4, driven by seasonal demand and new client acquisitions.",
        customers: "The customer base consists primarily of SMB clients (40%) and Enterprise accounts (35%). The top 10 customers represent 45% of revenue, with no single customer exceeding 8% - indicating healthy diversification.",
        employees: "The company has 24 full-time employees across sales, operations, and support. Key personnel include the founder (CEO), a VP of Sales, and an Operations Director. Succession planning is in progress.",
        default: "That's a great question. Based on the business profile, I can provide insights on revenue trends, customer composition, operational processes, and growth opportunities. Could you specify which area you'd like to explore?",
      };

      const lowerInput = input.toLowerCase();
      let responseContent = responses.default;
      if (lowerInput.includes("revenue") || lowerInput.includes("sales") || lowerInput.includes("financial")) {
        responseContent = responses.revenue;
      } else if (lowerInput.includes("customer") || lowerInput.includes("client")) {
        responseContent = responses.customers;
      } else if (lowerInput.includes("employee") || lowerInput.includes("team") || lowerInput.includes("staff")) {
        responseContent = responses.employees;
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  if (variant === "floating" && !isOpen) return null;

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-2xl shadow-elevated flex flex-col overflow-hidden",
        variant === "floating"
          ? "fixed bottom-6 right-6 w-96 h-[500px] z-50"
          : "min-h-0 w-full flex-1"
      )}
    >
      {variant === "floating" && (
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-navy flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Business Q&A</h3>
              <p className="text-xs text-muted-foreground">Ask anything about this profile</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex gap-2", msg.role === "user" && "flex-row-reverse")}>
            <div className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0",
              msg.role === "assistant" ? "gradient-navy" : "gradient-gold"
            )}>
              {msg.role === "assistant" ? (
                <Bot className="h-3.5 w-3.5 text-primary-foreground" />
              ) : (
                <User className="h-3.5 w-3.5 text-accent-foreground" />
              )}
            </div>
            <div className={cn(
              "px-3 py-2 rounded-xl text-sm max-w-[80%]",
              msg.role === "assistant"
                ? "bg-muted text-foreground"
                : "gradient-navy text-primary-foreground"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-lg gradient-navy flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="px-3 py-2 rounded-xl bg-muted">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          <Button 
            size="icon" 
            className="h-9 w-9 rounded-lg gradient-gold text-accent-foreground shadow-gold hover:opacity-90"
            onClick={handleSend}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QAChat;
