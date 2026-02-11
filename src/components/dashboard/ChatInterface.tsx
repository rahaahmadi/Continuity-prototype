import { useState, useRef, useEffect } from "react";
import { Send, Plus, Mic, Bot, User, Upload, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Welcome to Continuity! I'm here to help you prepare your business for a successful transition. Let's start by understanding your business better.\n\n**First, can you tell me about your business?** What industry are you in, and how long have you been operating?",
    timestamp: new Date(),
  },
];

const ChatInterface = () => {
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
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Thank you for sharing that! Understanding your industry context is crucial for potential buyers.\n\n**Next question:** Who are your key customers, and how dependent is the business on any single client relationship?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex gap-3 max-w-2xl", msg.role === "user" && "ml-auto flex-row-reverse")}>
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
              msg.role === "assistant" ? "gradient-navy" : "gradient-gold"
            )}>
              {msg.role === "assistant" ? (
                <Bot className="h-4 w-4 text-primary-foreground" />
              ) : (
                <User className="h-4 w-4 text-accent-foreground" />
              )}
            </div>
            <div className={cn(
              "px-4 py-3 rounded-xl text-sm leading-relaxed",
              msg.role === "assistant"
                ? "bg-card border border-border text-foreground shadow-soft"
                : "gradient-navy text-primary-foreground"
            )}>
              {msg.content.split("\n").map((line, i) => (
                <p key={i} className={cn(i > 0 && "mt-2")}>
                  {line.split("**").map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                  )}
                </p>
              ))}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 max-w-2xl">
            <div className="h-8 w-8 rounded-lg gradient-navy flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="px-4 py-3 rounded-xl bg-card border border-border shadow-soft">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 bg-card">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="flex-shrink-0 h-10 w-10 rounded-xl">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem className="gap-2">
                <Upload className="h-4 w-4" />
                Upload files
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Camera className="h-4 w-4" />
                Take photo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Type your answer or ask a question..."
              className="w-full h-10 px-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
            />
          </div>
          <Button variant="outline" size="icon" className="flex-shrink-0 h-10 w-10 rounded-xl">
            <Mic className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            className="flex-shrink-0 h-10 w-10 rounded-xl gradient-gold text-accent-foreground shadow-gold hover:opacity-90"
            onClick={handleSend}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
