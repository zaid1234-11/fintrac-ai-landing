import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, User, Bot, Loader2, TrendingUp, Wallet, Calendar, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/contexts/TransactionContext";
import { useBudgets } from "@/contexts/BudgetContext";

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp?: Date;
}

const SuggestedQuestions = ({ onSelect, disabled }: { onSelect: (q: string) => void; disabled: boolean }) => {
  const questions = [
    { icon: TrendingUp, text: "What's my biggest expense category?", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    { icon: Wallet, text: "Am I over budget on anything?", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    { icon: Calendar, text: "How much did I spend this month?", color: "bg-green-500/10 text-green-400 border-green-500/20" },
    { icon: Zap, text: "Give me financial advice", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
      {questions.map((q, i) => (
        <button
          key={i}
          onClick={() => onSelect(q.text)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl border backdrop-blur-sm transition-all duration-300",
            "hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
            q.color
          )}
        >
          <q.icon className="w-4 h-4 shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-left">{q.text}</span>
        </button>
      ))}
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex gap-1.5">
    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
  </div>
);

const ChatbotPage = () => {
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'ai', 
      content: "Hey there! 👋 I'm your AI financial assistant powered by Google Gemini 2.0.\n\nI can help you with:\n\n✨ Spending analysis & patterns\n💰 Budget tracking & alerts\n📊 Financial insights & tips\n🎯 Smart money management\n\nTry asking me a question below, or pick a suggested one!", 
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const userInput = messageText || input;
    if (userInput.trim() === "" || isLoading) return;

    const userMessage: Message = { role: 'user', content: userInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      const transactionContext = transactions.length > 0 
        ? transactions.map(t => 
            `${t.type === 'debit' ? 'Spent' : 'Received'} ₹${t.amount.toLocaleString('en-IN')} at ${t.merchant} for ${t.category} on ${new Date(t.date).toLocaleDateString('en-IN')}`
          ).join('.\n')
        : "No transactions available yet.";

      const categorySpending = transactions
        .filter(t => t.type === 'debit')
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

      const spendingSummary = Object.entries(categorySpending)
        .map(([cat, amt]) => `${cat}: ₹${amt.toLocaleString('en-IN')}`)
        .join(', ');

      const budgetContext = budgets.length > 0
        ? budgets.map(b => {
            const spent = transactions
              .filter(t => t.category === b.category && t.type === 'debit')
              .reduce((sum, t) => sum + t.amount, 0);
            const percentage = b.amount > 0 ? ((spent / b.amount) * 100).toFixed(1) : '0';
            return `${b.category} budget: ₹${b.amount.toLocaleString('en-IN')} ${b.period}, spent: ₹${spent.toLocaleString('en-IN')} (${percentage}% used)`;
          }).join('.\n')
        : "No budgets set yet.";

      const totalIncome = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
      const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

      const prompt = `
You are a helpful and friendly AI financial assistant for FinTrack AI.

Current date: ${new Date().toLocaleDateString('en-IN')}

FINANCIAL DATA:
Total Income: ₹${totalIncome.toLocaleString('en-IN')}
Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}
Net Balance: ₹${(totalIncome - totalExpenses).toLocaleString('en-IN')}
Total Budget: ₹${totalBudget.toLocaleString('en-IN')}

Category Spending: ${spendingSummary || 'None'}
Transactions: ${transactionContext}
Budgets: ${budgetContext}

User: "${userInput}"

Provide helpful financial insights. Use ₹ format. Keep under 150 words. Be encouraging. Use relevant emojis.
`;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("⚠️ Gemini API Key missing. Add VITE_GEMINI_API_KEY to .env");
      }
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
          }),
        }
      );

      if (!response.ok) throw new Error("API error occurred");

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiResponse) {
        setMessages(prev => [...prev, { role: 'ai', content: aiResponse, timestamp: new Date() }]);
      }
    } catch (error: any) {
      console.error("Chatbot error:", error);
      toast.error("Connection error", { description: error.message });
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: "Sorry, I'm having trouble right now. Please check your API key and try again.", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      <div className="max-w-5xl mx-auto h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)] flex flex-col">
        <Card className="flex-1 flex flex-col bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-2xl border-white/20 shadow-2xl overflow-hidden">
          {/* Header */}
          <CardHeader className="border-b border-white/10 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 backdrop-blur-xl shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent flex items-center gap-3">
                  <div className="relative">
                    <Sparkles className="w-7 h-7 text-primary animate-pulse" />
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                  </div>
                  AI Financial Assistant
                </CardTitle>
                <CardDescription className="text-slate-300 mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Gemini 2.0
                  </Badge>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
                    {transactions.length} transactions
                  </Badge>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10">
                    {budgets.length} budgets
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {/* Messages - FIXED SCROLLING */}
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
              <div className="space-y-6">
                {/* Show suggestions only at start */}
                {messages.length === 1 && !isLoading && (
                  <SuggestedQuestions 
                    onSelect={handleSendMessage} 
                    disabled={isLoading} 
                  />
                )}

                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "flex items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500",
                      message.role === 'user' && 'justify-end'
                    )}
                  >
                    {message.role === 'ai' && (
                      <div className="relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-md opacity-50 animate-pulse" />
                        <div className="relative w-full h-full bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-xl">
                          <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className={cn(
                      "group relative max-w-[85%] sm:max-w-lg rounded-3xl p-4 shadow-xl transition-all duration-300 hover:shadow-2xl",
                      message.role === 'user' 
                        ? 'bg-gradient-to-br from-primary to-primary/80 text-white ml-auto' 
                        : 'bg-slate-800/60 backdrop-blur-xl text-white border border-white/10'
                    )}>
                      <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                        {message.content}
                      </p>
                      {message.timestamp && (
                        <p className="text-[10px] sm:text-xs opacity-60 mt-2">
                          {message.timestamp.toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      )}
                    </div>

                    {message.role === 'user' && (
                      <div className="relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl blur-md opacity-50" />
                        <div className="relative w-full h-full bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-xl">
                          <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading state */}
                {isLoading && (
                  <div className="flex items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-md opacity-50 animate-pulse" />
                      <div className="relative w-full h-full bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
                        <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                    <div className="max-w-lg rounded-3xl p-4 bg-slate-800/60 backdrop-blur-xl border border-white/10 shadow-xl">
                      <div className="flex items-center gap-3">
                        <TypingIndicator />
                        <span className="text-slate-300 text-sm italic">Analyzing...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input area */}
            <div className="p-4 sm:p-6 border-t border-white/10 bg-slate-900/50 backdrop-blur-xl shrink-0">
              <div className="flex gap-2 sm:gap-3">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Ask me anything about your finances..."
                    className="h-12 sm:h-14 pl-4 pr-4 bg-slate-800/70 backdrop-blur-sm border-slate-600/50 text-white placeholder:text-slate-400 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-lg"
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  size="icon" 
                  onClick={() => handleSendMessage()} 
                  disabled={isLoading || input.trim() === ""} 
                  className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all shadow-xl rounded-2xl disabled:opacity-50 hover:scale-105 active:scale-95"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-3 text-center flex items-center justify-center gap-2">
                <Sparkles className="w-3 h-3" />
                Powered by Google Gemini 2.0 Flash
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatbotPage;
