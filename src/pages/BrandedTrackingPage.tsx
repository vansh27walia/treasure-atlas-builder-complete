import React, { useState, useEffect, useRef } from 'react';
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
import {
  Save, ExternalLink, Eye, CheckCircle, Copy, Globe, Upload, Palette,
  Store, AtSign, MessageSquare, Type, Mail, Package, Truck, MapPin, Clock
} from 'lucide-react';
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
  email_subject: string;
  email_message: string;
  email_support_email: string;
}

const templates = [
  { id: 'minimal', name: 'Minimal', description: 'Clean centered layout with just the essentials' },
  { id: 'timeline', name: 'Timeline', description: 'Step-by-step event timeline for detailed tracking' },
  { id: 'modern', name: 'Modern Card', description: 'Dashboard-style cards with a visual progress bar' },
];

const BrandedTrackingPage: React.FC = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PNG, JPG, WebP, or SVG file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File must be under 2MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/logo.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('shipping-labels')
        .upload(path, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('shipping-labels')
        .getPublicUrl(path);

      update('logo_url', urlData.publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
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
    toast.success('URL copied');
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Branded Tracking</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure your customer-facing tracking page, templates, and email notifications.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Tracking URL */}
      <div className="rounded-lg border bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Tracking URL</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Settings */}
        <div className="lg:col-span-3 space-y-6">

          {/* Section 1: Branding */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" /> Store Branding
              </CardTitle>
              <CardDescription>Logo, colors, and identity shown on your tracking page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Store Logo</Label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {settings.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {uploading ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WebP, or SVG. Max 2MB.</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Store Name</Label>
                  <Input value={settings.store_name} onChange={e => update('store_name', e.target.value)} placeholder="My Store" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Website URL</Label>
                  <Input value={settings.website_url} onChange={e => update('website_url', e.target.value)} placeholder="https://mystore.com" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Support Email</Label>
                  <Input value={settings.support_email} onChange={e => update('support_email', e.target.value)} placeholder="support@mystore.com" type="email" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Brand Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={settings.brand_color}
                      onChange={e => update('brand_color', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-border"
                    />
                    <Input value={settings.brand_color} onChange={e => update('brand_color', e.target.value)} className="flex-1 font-mono text-sm" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label className="text-sm">Custom Message</Label>
                <Textarea value={settings.custom_message} onChange={e => update('custom_message', e.target.value)} placeholder="Thank you for your order!" rows={2} className="resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Banner Message <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input value={settings.banner_message} onChange={e => update('banner_message', e.target.value)} placeholder="Free shipping on orders over $50!" />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Template Selection - Vertical */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" /> Tracking Page Template
              </CardTitle>
              <CardDescription>Choose a layout for your customer tracking page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => update('tracking_template', t.id)}
                  className={cn(
                    'w-full flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all',
                    settings.tracking_template === t.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30 hover:bg-muted/30'
                  )}
                >
                  <div className="w-16 h-12 rounded-md bg-muted/60 border flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <MiniPreview id={t.id} color={settings.brand_color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                  {settings.tracking_template === t.id && (
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Section 3: Email Settings */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" /> Email Notifications
              </CardTitle>
              <CardDescription>Customize the email sent when a tracking number is created.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Subject</Label>
                <Input value={settings.email_subject} onChange={e => update('email_subject', e.target.value)} placeholder="Your shipment is on its way!" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Body</Label>
                <Textarea value={settings.email_message} onChange={e => update('email_message', e.target.value)} placeholder="Your order has been shipped..." rows={3} className="resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Reply-to Email</Label>
                <Input value={settings.email_support_email} onChange={e => update('email_support_email', e.target.value)} placeholder="support@mystore.com" type="email" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Live Preview</p>
              <Badge variant="secondary" className="text-xs">{templates.find(t => t.id === settings.tracking_template)?.name}</Badge>
            </div>

            {/* Tracking Page Preview */}
            <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
              <TrackingPagePreview settings={settings} />
            </div>

            {/* Email Preview */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Email Preview</p>
              <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
                <div className="h-1" style={{ backgroundColor: settings.brand_color }} />
                <div className="p-4 space-y-3">
                  {settings.logo_url && <img src={settings.logo_url} alt="Logo" className="h-6 object-contain" />}
                  <p className="font-semibold text-sm text-foreground">{settings.email_subject || 'Your shipment is on its way!'}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{settings.email_message || 'Your order has been shipped.'}</p>
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white text-xs font-medium"
                    style={{ backgroundColor: settings.brand_color }}
                  >
                    <ExternalLink className="h-3 w-3" /> Track Package
                  </div>
                  <Separator />
                  <p className="text-[10px] text-muted-foreground">
                    {settings.store_name || 'Your Store'} • {settings.support_email || settings.email_support_email || 'support@store.com'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Mini template icon previews ── */
const MiniPreview: React.FC<{ id: string; color: string }> = ({ id, color }) => {
  if (id === 'minimal') {
    return (
      <div className="flex flex-col items-center gap-1 p-1">
        <div className="w-6 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        <div className="w-8 h-1 rounded-full bg-muted-foreground/15" />
        <div className="w-5 h-1 rounded-full bg-muted-foreground/10" />
      </div>
    );
  }
  if (id === 'timeline') {
    return (
      <div className="flex gap-1.5 p-1">
        <div className="flex flex-col items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          <div className="w-px flex-1 bg-muted-foreground/15" />
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="w-full h-1 rounded bg-muted-foreground/15" />
          <div className="w-2/3 h-1 rounded bg-muted-foreground/10" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1 p-1 w-full">
      <div className="flex gap-0.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full" style={i < 2 ? { backgroundColor: color, opacity: 0.5 } : { backgroundColor: '#d1d5db' }} />
        ))}
      </div>
      <div className="flex gap-1">
        <div className="flex-1 h-3 rounded border bg-card" />
        <div className="flex-1 h-3 rounded border bg-card" />
      </div>
    </div>
  );
};

/* ── Live Tracking Page Preview ── */
const TrackingPagePreview: React.FC<{ settings: MerchantSettings }> = ({ settings }) => {
  const brandColor = settings.brand_color || '#3B82F6';
  const template = settings.tracking_template;

  const mockEvents = [
    { status: 'In Transit', date: 'Mar 9, 2:30 PM', location: 'Chicago, IL' },
    { status: 'Picked Up', date: 'Mar 8, 9:00 AM', location: 'New York, NY' },
    { status: 'Label Created', date: 'Mar 7, 4:15 PM', location: 'New York, NY' },
  ];

  return (
    <div className="text-xs">
      {/* Banner */}
      {settings.banner_message && (
        <div className="text-white text-center py-1 px-2 text-[10px]" style={{ backgroundColor: brandColor }}>
          {settings.banner_message}
        </div>
      )}

      {/* Header */}
      <div className="border-b px-3 py-2 flex items-center gap-2">
        {settings.logo_url ? (
          <img src={settings.logo_url} alt="Logo" className="h-5 object-contain" />
        ) : (
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3" style={{ color: brandColor }} />
            <span className="font-semibold text-[10px] text-foreground">{settings.store_name || 'Your Store'}</span>
          </div>
        )}
      </div>

      <div className="p-3 space-y-3">
        {/* Status */}
        <div className={cn("flex items-center gap-2", template === 'minimal' && 'justify-center flex-col')}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${brandColor}20`, color: brandColor }}>
            <Truck className="h-3 w-3" />
          </div>
          <div className={template === 'minimal' ? 'text-center' : ''}>
            <Badge className="text-[9px] px-1.5 py-0" style={{ backgroundColor: brandColor, color: '#fff' }}>In Transit</Badge>
            <p className="font-mono text-[9px] text-muted-foreground mt-0.5">9400111899223</p>
          </div>
        </div>

        {template === 'modern' && (
          <div className="flex gap-1">
            {['Created', 'Picked Up', 'In Transit', 'Delivered'].map((s, i) => (
              <div key={s} className="flex-1">
                <div className="h-1 rounded-full" style={{ backgroundColor: i <= 2 ? brandColor : '#e5e7eb' }} />
                <p className="text-[7px] text-muted-foreground mt-0.5 text-center">{s}</p>
              </div>
            ))}
          </div>
        )}

        {settings.custom_message && (
          <div className="rounded px-2 py-1.5 border-l-2 text-[10px] text-muted-foreground" style={{ borderColor: brandColor, backgroundColor: `${brandColor}08` }}>
            {settings.custom_message}
          </div>
        )}

        {/* Events */}
        <div className="space-y-0">
          {mockEvents.map((evt, i) => (
            <div key={i} className="flex gap-2">
              {template !== 'minimal' && (
                <div className="flex flex-col items-center">
                  <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ backgroundColor: i === 0 ? brandColor : '#d1d5db' }} />
                  {i < mockEvents.length - 1 && <div className="w-px flex-1 bg-border my-0.5" />}
                </div>
              )}
              <div className="pb-2 flex-1">
                <p className={cn("text-[10px] font-medium", i === 0 ? 'text-foreground' : 'text-muted-foreground')}>{evt.status}</p>
                <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                  <span>{evt.date}</span>
                  <span>•</span>
                  <MapPin className="h-2 w-2" />
                  <span>{evt.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {settings.support_email && (
          <div className="text-center text-[9px] text-muted-foreground pt-1 border-t">
            Need help? <span style={{ color: brandColor }}>{settings.support_email}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandedTrackingPage;
