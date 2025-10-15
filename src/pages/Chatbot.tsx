import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, User, Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Mock Transaction Data (same as Transactions page for context) ---
interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  type: 'debit' | 'credit';
  date: string;
  category: string;
}

const mockTransactions: Transaction[] = [
  { id: '1', merchant: 'Zomato', amount: 450.00, type: 'debit', date: '2025-10-13T10:00:00Z', category: 'Food' },
  { id: '2', merchant: 'Salary Deposit', amount: 75000.00, type: 'credit', date: '2025-10-01T09:00:00Z', category: 'Salary' },
  { id: '3', merchant: 'IndiGo', amount: 8500.00, type: 'debit', date: '2025-10-11T15:30:00Z', category: 'Travel' },
  { id: '4', merchant: 'Airtel Bill', amount: 1199.00, type: 'debit', date: '2025-10-05T12:00:00Z', category: 'Bills' },
  { id: '5', merchant: 'Myntra', amount: 2500.00, type: 'debit', date: '2025-10-08T20:15:00Z', category: 'Shopping' },
  { id: '6', merchant: 'PVR Cinemas', amount: 880.00, type: 'debit', date: '2025-10-04T18:45:00Z', category: 'Entertainment' },
];

// --- Chat Component ---
interface Message {
  role: 'user' | 'ai';
  content: string;
}

const ChatbotPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hello! I'm your financial assistant. Ask me anything about your recent transactions." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === "" || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    // Convert transaction data to a string for the AI context
    const transactionContext = mockTransactions.map(t => 
      `${t.type === 'debit' ? 'Spent' : 'Received'} ₹${t.amount} at ${t.merchant} for ${t.category} on ${new Date(t.date).toLocaleDateString('en-GB')}`
    ).join('.\n');

    const prompt = `
      You are a helpful and friendly financial assistant for an app called FinTrack AI.
      Your knowledge is strictly limited to the transaction data provided below. Do not answer questions outside of this context.
      Today's date is October 14, 2025.
      
      Here is the user's recent transaction history:
      ---
      ${transactionContext}
      ---
      
      The user has asked the following question: "${input}"
      
      Based ONLY on the transaction data, provide a concise and helpful answer. If you cannot answer based on the data, say so.
    `;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key is missing.");
      }
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "An API error occurred.");
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiResponse) {
        setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
      } else {
        throw new Error("Received an empty response from the AI.");
      }

    } catch (error: any) {
      console.error("Chatbot error:", error);
      toast.error("An error occurred", { description: error.message });
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 h-[calc(100vh-4rem)] flex flex-col">
      <Card className="flex-1 flex flex-col bg-slate-800/40 backdrop-blur-xl border-white/10 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white text-2xl flex items-center gap-2">
            <Sparkles className="text-primary" />
            AI Financial Assistant
          </CardTitle>
          <CardDescription className="text-slate-400">Ask questions about your spending, income, and more.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div key={index} className={cn("flex items-start gap-4", message.role === 'user' && 'justify-end')}>
                  {message.role === 'ai' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-md rounded-xl p-3 text-white",
                    message.role === 'user' ? 'bg-primary' : 'bg-slate-700/50'
                  )}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                   {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
               {isLoading && (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="max-w-md rounded-xl p-3 bg-slate-700/50 flex items-center gap-2">
                       <Loader2 className="w-5 h-5 text-white animate-spin" />
                       <span className="text-slate-300 italic">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-white/10 bg-slate-800/20">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="E.g., How much did I spend on food?"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 h-12"
                disabled={isLoading}
              />
              <Button size="icon" onClick={handleSendMessage} disabled={isLoading} className="h-12 w-12 shrink-0">
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatbotPage;