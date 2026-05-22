import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Mail,
  Phone,
  HelpCircle,
  BookOpen,
  Video,
  Send,
  Clock,
  CheckCircle2,
  Search,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Support = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    category: "",
    subject: "",
    message: "",
  });

  const faqs = [
    {
      question: "How do I add transactions manually?",
      answer: "Go to the Transactions page and click the 'Add Transaction' button in the top-right corner. Fill in the merchant name, amount, type (debit/credit), category, and date. Click 'Add Transaction' to save.",
      category: "Transactions",
    },
    {
      question: "How does AI spending analysis work?",
      answer: "Our AI analyzes your transaction patterns, spending habits, and budget allocation. It provides insights like overspending alerts, category-wise breakdowns, spending trends, and personalized recommendations to help you save money.",
      category: "AI Features",
    },
    {
      question: "Is my financial data secure?",
      answer: "Yes! All your data is encrypted and stored locally on your device using browser localStorage. We don't store your financial information on any servers. You can export or delete your data anytime from Settings.",
      category: "Privacy & Security",
    },
    {
      question: "How do I switch between light and dark mode?",
      answer: "Go to Settings > Appearance tab and click either the 'Light' or 'Dark' button. Your theme preference is saved automatically and will persist across sessions.",
      category: "Settings",
    },
    {
      question: "Can I export my transaction data?",
      answer: "Yes! Go to Settings > Data tab and click the 'Export' button. This will download all your transactions and settings as a JSON file that you can save as backup.",
      category: "Data Management",
    },
    {
      question: "What categories are available for transactions?",
      answer: "We support 7 categories: Food, Travel, Bills, Shopping, Entertainment, Other, and Salary. You can assign any transaction to these categories for better organization and AI analysis.",
      category: "Transactions",
    },
    {
      question: "How do I connect my bank account?",
      answer: "Currently, bank account integration is in development. You can manually add transactions or use our upcoming SMS parsing feature for automatic transaction detection.",
      category: "Bank Integration",
    },
    {
      question: "What is the AI Analysis feature?",
      answer: "AI Analysis provides detailed spending insights including trends over time, category breakdowns, budget alerts, and future spending predictions. Access it from the Dashboard or via the AI Analysis link in the sidebar.",
      category: "AI Features",
    },
    {
      question: "How do I set savings goals?",
      answer: "Savings goals are displayed on your Dashboard. Track your progress toward financial targets and get AI-powered recommendations on how to reach them faster.",
      category: "Savings",
    },
    {
      question: "Can I delete all my data?",
      answer: "Yes, go to Settings > Data tab and scroll to the 'Danger Zone'. Click 'Clear All Data' - but note this action cannot be undone. Make sure to export your data first if you want to keep a backup.",
      category: "Data Management",
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitContact = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Simulate sending
    toast.success("Support request submitted!", {
      description: "We'll get back to you within 24 hours.",
    });

    // Reset form
    setContactForm({
      name: "",
      email: "",
      category: "",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support Center</h1>
        <p className="text-muted-foreground mt-1">
          Get help with FinTrack AI - Browse FAQs or contact our support team
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-sm text-muted-foreground">Support Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">&lt; 2hrs</p>
                <p className="text-sm text-muted-foreground">Average Response</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">98%</p>
                <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="faq" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="faq">
            <HelpCircle className="h-4 w-4 mr-2" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="contact">
            <Mail className="h-4 w-4 mr-2" />
            Contact Us
          </TabsTrigger>
          <TabsTrigger value="guides">
            <BookOpen className="h-4 w-4 mr-2" />
            Guides
          </TabsTrigger>
          <TabsTrigger value="videos">
            <Video className="h-4 w-4 mr-2" />
            Tutorials
          </TabsTrigger>
        </TabsList>

        {/* FAQs Tab */}
        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Find answers to common questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* FAQ List */}
              <div className="space-y-3">
                {filteredFaqs.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No FAQs found</p>
                ) : (
                  filteredFaqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border rounded-lg overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="w-full p-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{faq.question}</span>
                            <Badge variant="outline" className="text-xs">
                              {faq.category}
                            </Badge>
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${
                            expandedFaq === index ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {expandedFaq === index && (
                        <div className="p-4 pt-0 border-t bg-muted/30">
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Mail className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Email Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Get help via email within 24 hours
                </p>
                <p className="text-sm font-medium">support@fintrack.ai</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Phone className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Phone Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Mon-Fri, 9 AM - 6 PM IST
                </p>
                <p className="text-sm font-medium">+91 98765 43210</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-8 w-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Live Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Chat with our support team
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Start Chat
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Submit a Support Request</CardTitle>
              <CardDescription>Fill out the form and we'll respond shortly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, name: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={contactForm.category}
                    onValueChange={(value) =>
                      setContactForm({ ...contactForm, category: value })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="billing">Billing Question</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="account">Account Help</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description"
                    value={contactForm.subject}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, subject: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue or question..."
                  className="min-h-[120px]"
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                />
              </div>

              <Button onClick={handleSubmitContact} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guides Tab */}
        <TabsContent value="guides" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Getting Started Guide
                  <ExternalLink className="h-4 w-4" />
                </CardTitle>
                <CardDescription>Learn the basics of FinTrack AI</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Complete walkthrough of setting up your account, adding transactions, and using core features.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  AI Analysis Guide
                  <ExternalLink className="h-4 w-4" />
                </CardTitle>
                <CardDescription>Understanding AI insights</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Learn how to interpret AI-generated insights, predictions, and spending recommendations.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Budget Management
                  <ExternalLink className="h-4 w-4" />
                </CardTitle>
                <CardDescription>Master your finances</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tips and strategies for creating effective budgets and tracking spending goals.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Data & Privacy
                  <ExternalLink className="h-4 w-4" />
                </CardTitle>
                <CardDescription>Your data security</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Learn how we protect your financial data and manage your privacy settings.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Quick Start Tutorial", duration: "3:45" },
              { title: "Adding Transactions", duration: "2:20" },
              { title: "Understanding AI Insights", duration: "5:10" },
              { title: "Export & Backup Data", duration: "1:55" },
              { title: "Theme Customization", duration: "1:30" },
              { title: "Security Best Practices", duration: "4:00" },
            ].map((video, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">{video.title}</h3>
                  <p className="text-sm text-muted-foreground">{video.duration}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Support;
