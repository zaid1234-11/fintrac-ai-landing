const fs = require('fs');

const correctTop = `"use client";

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
  ExternalLink} from "lucide-react";
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
  });`;

let code = fs.readFileSync('src/app/dashboard/support/page.tsx', 'utf8');

// Find the start of the faqs array and everything after it
const splitIndex = code.indexOf('  const faqs = [');
if (splitIndex !== -1) {
    const bottomPart = code.substring(splitIndex);
    fs.writeFileSync('src/app/dashboard/support/page.tsx', correctTop + "\n\n" + bottomPart);
    console.log("Fixed!");
} else {
    console.log("Could not find faqs array.");
}
