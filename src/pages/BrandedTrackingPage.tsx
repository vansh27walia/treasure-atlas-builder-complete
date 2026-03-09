import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Palette, Mail, Layout, Save, ExternalLink, Eye, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MerchantSettings {
  logo_url: string;
  brand_color: string;
  store_name: string;
  website_url: string;
  support_email: string;
  custom_message: string;
  banner_message: string;
  tracking_template: string;
  // email fields
  email_subject: string;
  email_message: string;
  email_support_email: string;
}

const templates = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple tracking page with essential info only.',
    preview: 'bg-white border-2',
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Detailed shipment timeline with step-by-step tracking events.',
    preview: 'bg-white border-2',
  },
  {
    id: 'modern',
    name: 'Modern Card',
    description: 'Modern dashboard-style layout with cards and visual status.',
    preview: 'bg-white border-2',
  },
];

const BrandedTrackingPage: React.FC = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
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
      // Load tracking settings
      const { data: tracking } = await supabase
        .from('merchant_tracking_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      // Load email settings
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
      // Upsert tracking settings
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

      // Upsert email settings
      const { error: emailErr } = await supabase
        .from('merchant_email_settings')
        .upsert({
          user_id: user.id,
          email_subject: settings.email_subject || null,
          email_message: settings.email_message || null,
          support_email: settings.email_support_email || null,
        }, { onConflict: 'user_id' });

      if (emailErr) throw emailErr;

      toast.success('Branded tracking settings saved!');
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Branded Tracking</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Customize your tracking page, email notifications, and branding — all in one place.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      {/* Preview Link */}
      <Card className="border-dashed bg-muted/30">
        <CardContent className="py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Your tracking page URL</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">{trackingUrl}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(`${window.location.origin}/track`, '_blank')}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
        </CardContent>
      </Card>

      {/* Section 1: Branding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Brand Settings</CardTitle>
              <CardDescription>Configure how your tracking page looks to customers.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input value={settings.store_name} onChange={e => update('store_name', e.target.value)} placeholder="My Awesome Store" />
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input value={settings.website_url} onChange={e => update('website_url', e.target.value)} placeholder="https://mystore.com" />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input value={settings.logo_url} onChange={e => update('logo_url', e.target.value)} placeholder="https://mystore.com/logo.png" />
              {settings.logo_url && (
                <img src={settings.logo_url} alt="Logo preview" className="h-10 object-contain mt-2 rounded border p-1 bg-white" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Brand Color</Label>
              <div className="flex gap-2">
                <input type="color" value={settings.brand_color} onChange={e => update('brand_color', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                <Input value={settings.brand_color} onChange={e => update('brand_color', e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input value={settings.support_email} onChange={e => update('support_email', e.target.value)} placeholder="support@mystore.com" type="email" />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Custom Message (shown on tracking page)</Label>
            <Textarea value={settings.custom_message} onChange={e => update('custom_message', e.target.value)} placeholder="Thank you for your order!" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Banner Message (optional top bar)</Label>
            <Input value={settings.banner_message} onChange={e => update('banner_message', e.target.value)} placeholder="Free shipping on orders over $50!" />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Template Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layout className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Tracking Page Template</CardTitle>
              <CardDescription>Choose how your customers see their tracking information.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => update('tracking_template', t.id)}
                className={cn(
                  'relative rounded-xl border-2 p-4 text-left transition-all hover:shadow-md',
                  settings.tracking_template === t.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-muted-foreground/30'
                )}
              >
                {settings.tracking_template === t.id && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                )}
                {/* Mini preview */}
                <div className="h-24 rounded-lg bg-muted mb-3 flex items-center justify-center overflow-hidden">
                  <TemplatePreview id={t.id} color={settings.brand_color} />
                </div>
                <p className="font-semibold text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Email Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Email Notifications</CardTitle>
              <CardDescription>Customize the email customers receive when their shipment is created.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email Subject</Label>
            <Input value={settings.email_subject} onChange={e => update('email_subject', e.target.value)} placeholder="Your shipment is on its way!" />
          </div>
          <div className="space-y-2">
            <Label>Email Message</Label>
            <Textarea value={settings.email_message} onChange={e => update('email_message', e.target.value)} placeholder="Your order has been shipped. Click the link below to track your package." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Reply-to Email</Label>
            <Input value={settings.email_support_email} onChange={e => update('email_support_email', e.target.value)} placeholder="support@mystore.com" type="email" />
          </div>

          {/* Email Preview */}
          <Separator />
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Email Preview</p>
            <div className="rounded-lg border bg-white p-6 max-w-md">
              <p className="font-semibold text-sm text-gray-900">{settings.email_subject || 'Your shipment is on its way!'}</p>
              <Separator className="my-3" />
              <p className="text-sm text-gray-600">{settings.email_message || 'Your order has been shipped.'}</p>
              <div className="mt-4 p-3 rounded bg-blue-50 border border-blue-100">
                <p className="text-xs text-gray-500">Track your shipment:</p>
                <p className="text-xs text-blue-600 font-mono mt-1 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  {`${window.location.origin}/track/940011189922`}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Footer */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
};

// Mini template previews
const TemplatePreview: React.FC<{ id: string; color: string }> = ({ id, color }) => {
  if (id === 'minimal') {
    return (
      <div className="w-full h-full p-2 flex flex-col items-center justify-center gap-1">
        <div className="w-8 h-2 rounded" style={{ backgroundColor: color }} />
        <div className="w-12 h-1.5 rounded bg-gray-200" />
        <div className="w-10 h-1.5 rounded bg-gray-200" />
        <div className="w-6 h-4 rounded mt-1" style={{ backgroundColor: color, opacity: 0.3 }} />
      </div>
    );
  }
  if (id === 'timeline') {
    return (
      <div className="w-full h-full p-2 flex gap-2">
        <div className="flex flex-col items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <div className="w-0.5 flex-1 bg-gray-200" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <div className="w-0.5 flex-1 bg-gray-200" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <div className="w-full h-2 rounded bg-gray-200" />
          <div className="w-3/4 h-2 rounded bg-gray-200" />
          <div className="w-2/3 h-2 rounded bg-gray-200" />
        </div>
      </div>
    );
  }
  // modern
  return (
    <div className="w-full h-full p-2 flex flex-col gap-1.5">
      <div className="w-full h-6 rounded" style={{ backgroundColor: color, opacity: 0.15 }} />
      <div className="flex gap-1">
        <div className="w-1/2 h-8 rounded border bg-white" />
        <div className="w-1/2 h-8 rounded border bg-white" />
      </div>
    </div>
  );
};

export default BrandedTrackingPage;
