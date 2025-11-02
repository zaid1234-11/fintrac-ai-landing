import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Bell,
  Shield,
  Palette,
  Download,
  Upload,
  Trash2,
  Lock,
  CreditCard,
  Database,
  AlertCircle,
  Moon,
  Sun,
} from "lucide-react";
import { useState } from "react";
import { useTransactions } from "@/contexts/TransactionContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

const Settings = () => {
  const { transactions } = useTransactions();
  const { theme, setTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    // Profile
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+91 98765 43210",
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    budgetAlerts: true,
    
    // Appearance
    currency: "INR",
    language: "en",
    
    // Privacy
    dataSharing: false,
    analytics: true,
  });

  const handleExportData = () => {
    const dataStr = JSON.stringify({
      transactions,
      settings,
      exportDate: new Date().toISOString(),
    }, null, 2);
    
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fintrack-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    toast.success('Data exported successfully!');
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.clear();
      toast.success('All data cleared. Please refresh the page.');
      setTimeout(() => window.location.reload(), 2000);
    }
  };

  const handleSave = () => {
    localStorage.setItem('fintrack_settings', JSON.stringify(settings));
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="h-4 w-4 mr-2" />
            Data
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Change Password</Label>
                  <p className="text-sm text-muted-foreground">
                    Update your password regularly for security
                  </p>
                </div>
                <Button variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  Change
                </Button>
              </div>

              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Link your bank accounts and cards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">HDFC Bank</p>
                    <p className="text-sm text-muted-foreground">****1234</p>
                  </div>
                </div>
                <Badge>Connected</Badge>
              </div>
              <Button variant="outline" className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                Add Bank Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get instant notifications on your device
                  </p>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, pushNotifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly spending summaries
                  </p>
                </div>
                <Switch
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, weeklyReports: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Budget Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when approaching budget limits
                  </p>
                </div>
                <Switch
                  checked={settings.budgetAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, budgetAlerts: checked })
                  }
                />
              </div>

              <Button onClick={handleSave}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize how FinTrack AI looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark theme
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="gap-2"
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="gap-2"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={settings.currency}
                  onValueChange={(value) => setSettings({ ...settings, currency: value })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">₹ Indian Rupee (INR)</SelectItem>
                    <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">£ British Pound (GBP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => setSettings({ ...settings, language: value })}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Security</CardTitle>
              <CardDescription>Manage your privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Data Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Share anonymized data to improve AI features
                  </p>
                </div>
                <Switch
                  checked={settings.dataSharing}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, dataSharing: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Help us improve by sharing usage statistics
                  </p>
                </div>
                <Switch
                  checked={settings.analytics}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, analytics: checked })
                  }
                />
              </div>

              <Separator />

              <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      Your privacy matters
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      We never sell your data. All financial information is encrypted and stored securely.
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleSave}>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export, import, or delete your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg space-y-2">
                  <Download className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold">Export Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Download all your transactions and settings as JSON
                  </p>
                  <Button onClick={handleExportData} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <Upload className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold">Import Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Restore your data from a previous export
                  </p>
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Storage Information</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You have <strong>{transactions.length}</strong> transactions stored locally.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">
                      Danger Zone
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      This action cannot be undone. All your data will be permanently deleted.
                    </p>
                  </div>
                </div>
                <Button onClick={handleClearData} variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
