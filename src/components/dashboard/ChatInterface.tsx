import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "../ui/use-toast";

interface Message {
  role: "user" | "ai";
  content: string;
}

const initialMessages: Message[] = [
  { role: "ai", content: "Hello! I am your FinTrack AI assistant. How can I help you with your finances today?" },
];

export const ChatInterface = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // This is a placeholder for a real API call.
      // In a real app, you would send `userMessage.content` to your backend.
      await new Promise(resolve => setTimeout(resolve, 1500));
      const aiResponse: Message = { role: "ai", content: `This is a mock response to: "${userMessage.content}". To implement the real AI, you would make an API call here, similar to the Invest page.` };
      
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get a response from the AI assistant.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700 rounded-xl flex flex-col h-[60vh] min-h-[400px]">
      <CardHeader className="border-b border-slate-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">FinTrack AI Assistant</CardTitle>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-500">Online</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "bg-slate-700 text-slate-100"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-slate-700 text-slate-100 flex items-center gap-2">
                   <Loader2 className="w-4 h-4 animate-spin" />
                   <span>Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-slate-700">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              placeholder="Ask about your transactions..."
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="shrink-0" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};
