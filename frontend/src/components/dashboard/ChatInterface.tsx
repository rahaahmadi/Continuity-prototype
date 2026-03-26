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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const TEXTAREA_MAX_PX = 200;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const fullHeight = el.scrollHeight;
    const next = Math.min(fullHeight, TEXTAREA_MAX_PX);
    el.style.height = `${next}px`;
    el.style.overflowY = fullHeight > TEXTAREA_MAX_PX ? "auto" : "hidden";
  }, [input]);

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
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-2 space-y-6">
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

      <div className="mx-auto w-full max-w-2xl shrink-0 px-6 py-2">
        <div className="rounded-2xl border border-border bg-card p-2 shadow-soft transition-colors focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-ring/15">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Type your answer or ask a question..."
            className="w-full min-h-10 max-h-[200px] resize-none overflow-y-hidden bg-transparent px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none"
          />
          <div className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
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
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg gradient-gold text-accent-foreground shadow-gold hover:opacity-90"
                onClick={handleSend}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
