import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Palette, Image, Mail, MessageSquare, Eye, Copy } from 'lucide-react';

const CustomTrackingSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    logo_url: '',
    brand_color: '#3B82F6',
    support_email: '',
    custom_message: 'Thank you for your order!',
    banner_message: '',
  });

  useEffect(() => {
    if (user) loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('merchant_tracking_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (data) {
        setSettings({
          logo_url: data.logo_url || '',
          brand_color: data.brand_color || '#3B82F6',
          support_email: data.support_email || '',
          custom_message: data.custom_message || '',
          banner_message: data.banner_message || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('merchant_tracking_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('merchant_tracking_settings')
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('merchant_tracking_settings')
          .insert({ ...settings, user_id: user.id });
      }
      toast.success('Tracking page settings saved!');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const trackingPageUrl = `${window.location.origin}/track`;

  const copyUrl = () => {
    navigator.clipboard.writeText(trackingPageUrl);
    toast.success('Tracking page URL copied!');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Custom Tracking Page</h1>
        <p className="text-muted-foreground mt-2">
          Customize the branded tracking page your customers will see.
        </p>
      </div>

      {/* Tracking Page URL */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Your Tracking Page URL</p>
              <p className="text-sm text-muted-foreground font-mono mt-1">{trackingPageUrl}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyUrl}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('/track', '_blank')}>
                <Eye className="h-4 w-4 mr-1" /> Preview
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" /> Branding
          </CardTitle>
          <CardDescription>Set your brand colors and logo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <div className="flex gap-2">
              <Input
                value={settings.logo_url}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                placeholder="https://your-domain.com/logo.png"
              />
              {settings.logo_url && (
                <img src={settings.logo_url} alt="Logo preview" className="h-10 w-10 object-contain rounded border" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Brand Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.brand_color}
                onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer border-0"
              />
              <Input
                value={settings.brand_color}
                onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
                placeholder="#3B82F6"
                className="w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messaging */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Customer Messaging
          </CardTitle>
          <CardDescription>Messages displayed on your tracking page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Custom Message</Label>
            <Textarea
              value={settings.custom_message}
              onChange={(e) => setSettings({ ...settings, custom_message: e.target.value })}
              placeholder="Thank you for your order!"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Banner Message (optional)</Label>
            <Input
              value={settings.banner_message}
              onChange={(e) => setSettings({ ...settings, banner_message: e.target.value })}
              placeholder="Free shipping on orders over $50!"
            />
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Support Contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Support Email</Label>
            <Input
              type="email"
              value={settings.support_email}
              onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              placeholder="support@your-store.com"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
};

export default CustomTrackingSettingsPage;
