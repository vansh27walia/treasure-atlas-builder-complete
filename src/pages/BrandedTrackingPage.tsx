import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Palette, Mail, Layout, Save, ExternalLink, Eye, CheckCircle,
  Copy, Store, Globe, Image, AtSign, MessageSquare, Type, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MerchantSettings {
  logo_url: string;
  brand_color: string;
  store_name: string;
  website_url: string;
  support_email: string;
  custom_message: string;
  banner_message: string;
  tracking_template: string;
  email_subject: string;
  email_message: string;
  email_support_email: string;
}

const templates = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, centered layout with just the essentials.',
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Step-by-step event timeline for detailed tracking.',
  },
  {
    id: 'modern',
    name: 'Modern Card',
    description: 'Dashboard-style cards with a visual progress bar.',
  },
];

const BrandedTrackingPage: React.FC = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<MerchantSettings>({
    logo_url: '',
    brand_color: '#3B82F6',
    store_name: '',
    website_url: '',
    support_email: '',
    custom_message: 'Thank you for your order!',
    banner_message: '',
    tracking_template: 'timeline',
    email_subject: 'Your shipment is on its way!',
    email_message: 'Your order has been shipped. Click the link below to track your package.',
    email_support_email: '',
  });

  useEffect(() => {
    if (user) loadSettings();
  }, [user]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data: tracking } = await supabase
        .from('merchant_tracking_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      const { data: email } = await supabase
        .from('merchant_email_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (tracking || email) {
        setSettings(prev => ({
          ...prev,
          ...(tracking && {
            logo_url: tracking.logo_url || '',
            brand_color: tracking.brand_color || '#3B82F6',
            store_name: (tracking as any).store_name || '',
            website_url: (tracking as any).website_url || '',
            support_email: tracking.support_email || '',
            custom_message: tracking.custom_message || '',
            banner_message: tracking.banner_message || '',
            tracking_template: (tracking as any).tracking_template || 'timeline',
          }),
          ...(email && {
            email_subject: email.email_subject || '',
            email_message: email.email_message || '',
            email_support_email: email.support_email || '',
          }),
        }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: trackingErr } = await supabase
        .from('merchant_tracking_settings')
        .upsert({
          user_id: user.id,
          logo_url: settings.logo_url || null,
          brand_color: settings.brand_color,
          support_email: settings.support_email || null,
          custom_message: settings.custom_message || null,
          banner_message: settings.banner_message || null,
          tracking_template: settings.tracking_template,
          store_name: settings.store_name || null,
          website_url: settings.website_url || null,
        } as any, { onConflict: 'user_id' });
      if (trackingErr) throw trackingErr;

      const { error: emailErr } = await supabase
        .from('merchant_email_settings')
        .upsert({
          user_id: user.id,
          email_subject: settings.email_subject || null,
          email_message: settings.email_message || null,
          support_email: settings.email_support_email || null,
        }, { onConflict: 'user_id' });
      if (emailErr) throw emailErr;

      toast.success('Settings saved successfully!');
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof MerchantSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const trackingUrl = `${window.location.origin}/track/TRACKING_NUMBER`;

  const copyUrl = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Branded Tracking</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Set up your branded tracking page, email notifications, and customer experience.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 shadow-sm">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Tracking URL Bar */}
        <div className="rounded-xl border bg-card p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Tracking Page</p>
              <p className="text-sm font-mono text-foreground truncate">{trackingUrl}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={copyUrl}>
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`${window.location.origin}/track`, '_blank')}>
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
          </div>
        </div>

        {/* Tabbed Sections */}
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 h-auto">
            <TabsTrigger value="branding" className="gap-2 data-[state=active]:shadow-sm">
              <Palette className="h-4 w-4" /> Branding
            </TabsTrigger>
            <TabsTrigger value="template" className="gap-2 data-[state=active]:shadow-sm">
              <Layout className="h-4 w-4" /> Template
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2 data-[state=active]:shadow-sm">
              <Mail className="h-4 w-4" /> Email
            </TabsTrigger>
          </TabsList>

          {/* ── BRANDING TAB ── */}
          <TabsContent value="branding" className="space-y-6 mt-0">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Store Identity</CardTitle>
                <CardDescription>This information appears on your customer-facing tracking page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField icon={<Store className="h-4 w-4" />} label="Store Name">
                    <Input value={settings.store_name} onChange={e => update('store_name', e.target.value)} placeholder="My Awesome Store" />
                  </FormField>
                  <FormField icon={<Globe className="h-4 w-4" />} label="Website URL">
                    <Input value={settings.website_url} onChange={e => update('website_url', e.target.value)} placeholder="https://mystore.com" />
                  </FormField>
                  <FormField icon={<Image className="h-4 w-4" />} label="Logo URL" hint="Paste a direct link to your logo image">
                    <Input value={settings.logo_url} onChange={e => update('logo_url', e.target.value)} placeholder="https://mystore.com/logo.png" />
                    {settings.logo_url && (
                      <div className="mt-2 p-2 rounded-lg border bg-muted/30 inline-block">
                        <img src={settings.logo_url} alt="Logo preview" className="h-8 object-contain" />
                      </div>
                    )}
                  </FormField>
                  <FormField icon={<Palette className="h-4 w-4" />} label="Brand Color">
                    <div className="flex gap-2 items-center">
                      <div className="relative">
                        <input
                          type="color"
                          value={settings.brand_color}
                          onChange={e => update('brand_color', e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-border appearance-none bg-transparent"
                          style={{ padding: 0 }}
                        />
                      </div>
                      <Input value={settings.brand_color} onChange={e => update('brand_color', e.target.value)} className="flex-1 font-mono text-sm" />
                      <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: settings.brand_color }} />
                    </div>
                  </FormField>
                  <FormField icon={<AtSign className="h-4 w-4" />} label="Support Email">
                    <Input value={settings.support_email} onChange={e => update('support_email', e.target.value)} placeholder="support@mystore.com" type="email" />
                  </FormField>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Customer Messages</CardTitle>
                <CardDescription>Messages displayed on your branded tracking page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField icon={<MessageSquare className="h-4 w-4" />} label="Tracking Page Message" hint="Shown below the shipment status">
                  <Textarea value={settings.custom_message} onChange={e => update('custom_message', e.target.value)} placeholder="Thank you for your order!" rows={2} className="resize-none" />
                </FormField>
                <FormField icon={<Type className="h-4 w-4" />} label="Banner Message" hint="Optional colored bar at the top of the page">
                  <Input value={settings.banner_message} onChange={e => update('banner_message', e.target.value)} placeholder="Free shipping on orders over $50!" />
                </FormField>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TEMPLATE TAB ── */}
          <TabsContent value="template" className="mt-0">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Tracking Page Layout</CardTitle>
                <CardDescription>Select a template for your customer-facing tracking page.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => update('tracking_template', t.id)}
                      className={cn(
                        'group relative rounded-xl border-2 p-5 text-left transition-all duration-200',
                        settings.tracking_template === t.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/40 hover:bg-muted/30'
                      )}
                    >
                      {settings.tracking_template === t.id && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="h-28 rounded-lg bg-muted/60 mb-4 flex items-center justify-center overflow-hidden border">
                        <TemplatePreview id={t.id} color={settings.brand_color} />
                      </div>
                      <p className="font-semibold text-sm text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── EMAIL TAB ── */}
          <TabsContent value="email" className="space-y-6 mt-0">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Email Configuration</CardTitle>
                <CardDescription>Customize the notification email sent when a tracking number is created.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField icon={<Type className="h-4 w-4" />} label="Email Subject">
                  <Input value={settings.email_subject} onChange={e => update('email_subject', e.target.value)} placeholder="Your shipment is on its way!" />
                </FormField>
                <FormField icon={<MessageSquare className="h-4 w-4" />} label="Email Body">
                  <Textarea value={settings.email_message} onChange={e => update('email_message', e.target.value)} placeholder="Your order has been shipped..." rows={3} className="resize-none" />
                </FormField>
                <FormField icon={<AtSign className="h-4 w-4" />} label="Reply-to Email">
                  <Input value={settings.email_support_email} onChange={e => update('email_support_email', e.target.value)} placeholder="support@mystore.com" type="email" />
                </FormField>
              </CardContent>
            </Card>

            {/* Email Preview */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Email Preview</CardTitle>
                <CardDescription>This is what your customers will see.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border bg-muted/20 p-6 max-w-lg mx-auto">
                  {/* Mock email */}
                  <div className="rounded-lg bg-white border shadow-sm overflow-hidden">
                    {/* Email header bar */}
                    <div className="h-1.5" style={{ backgroundColor: settings.brand_color }} />
                    <div className="p-6 space-y-4">
                      {settings.logo_url && (
                        <img src={settings.logo_url} alt="Logo" className="h-7 object-contain" />
                      )}
                      <p className="font-semibold text-base text-gray-900">
                        {settings.email_subject || 'Your shipment is on its way!'}
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {settings.email_message || 'Your order has been shipped.'}
                      </p>
                      <div className="pt-2">
                        <div
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium"
                          style={{ backgroundColor: settings.brand_color }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Track Your Package
                        </div>
                      </div>
                      <Separator />
                      <p className="text-xs text-gray-400">
                        {settings.store_name || 'Your Store'} • {settings.support_email || settings.email_support_email || 'support@store.com'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sticky Save Bar (bottom) */}
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t mt-8 -mx-4 md:-mx-8 px-4 md:px-8 py-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 shadow-sm">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};

// ── Reusable Form Field ──
const FormField: React.FC<{
  icon: React.ReactNode;
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ icon, label, hint, children }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <Label className="text-sm font-medium">{label}</Label>
      {hint && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] text-xs">
            {hint}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
    {children}
  </div>
);

// ── Mini Template Previews ──
const TemplatePreview: React.FC<{ id: string; color: string }> = ({ id, color }) => {
  if (id === 'minimal') {
    return (
      <div className="w-full h-full p-3 flex flex-col items-center justify-center gap-1.5">
        <div className="w-10 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        <div className="w-14 h-1.5 rounded-full bg-muted-foreground/15" />
        <div className="w-12 h-1.5 rounded-full bg-muted-foreground/10" />
        <div className="w-8 h-5 rounded mt-1" style={{ backgroundColor: color, opacity: 0.2 }} />
      </div>
    );
  }
  if (id === 'timeline') {
    return (
      <div className="w-full h-full p-3 flex gap-3">
        <div className="flex flex-col items-center gap-1.5 pt-0.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <div className="w-0.5 flex-1 bg-muted-foreground/15 rounded-full" />
          <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
          <div className="w-0.5 flex-1 bg-muted-foreground/15 rounded-full" />
          <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/15" />
        </div>
        <div className="flex flex-col gap-3 flex-1 pt-0.5">
          <div className="space-y-1">
            <div className="w-full h-2 rounded-full bg-muted-foreground/15" />
            <div className="w-2/3 h-1.5 rounded-full bg-muted-foreground/10" />
          </div>
          <div className="space-y-1">
            <div className="w-3/4 h-2 rounded-full bg-muted-foreground/12" />
            <div className="w-1/2 h-1.5 rounded-full bg-muted-foreground/8" />
          </div>
          <div className="w-2/3 h-2 rounded-full bg-muted-foreground/10" />
        </div>
      </div>
    );
  }
  // modern
  return (
    <div className="w-full h-full p-3 flex flex-col gap-2">
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={cn("flex-1 h-2 rounded-full", i >= 2 && "bg-muted-foreground/15")}
            style={i < 2 ? { backgroundColor: color, opacity: 0.6 } : undefined}
          />
        ))}
      </div>
      <div className="flex gap-2 flex-1">
        <div className="w-1/2 rounded-md border bg-card p-1.5">
          <div className="w-full h-1.5 rounded bg-muted-foreground/12 mb-1" />
          <div className="w-2/3 h-1.5 rounded bg-muted-foreground/8" />
        </div>
        <div className="w-1/2 rounded-md border bg-card p-1.5">
          <div className="w-full h-1.5 rounded bg-muted-foreground/12 mb-1" />
          <div className="w-2/3 h-1.5 rounded bg-muted-foreground/8" />
        </div>
      </div>
    </div>
  );
};

export default BrandedTrackingPage;
