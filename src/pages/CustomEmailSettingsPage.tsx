import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, FileText } from 'lucide-react';

const CustomEmailSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    email_subject: 'Your shipment is on its way!',
    email_message: 'Your order has been shipped. Click the link below to track your package.',
    support_email: '',
  });

  useEffect(() => {
    if (user) loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data } = await (supabase as any)
        .from('merchant_email_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (data) {
        setSettings({
          email_subject: data.email_subject || '',
          email_message: data.email_message || '',
          support_email: data.support_email || '',
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
      const { data: existing } = await (supabase as any)
        .from('merchant_email_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await (supabase as any)
          .from('merchant_email_settings')
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      } else {
        await (supabase as any)
          .from('merchant_email_settings')
          .insert({ ...settings, user_id: user.id });
      }
      toast.success('Email settings saved!');
    } catch (err) {
      toast.error('Failed to save email settings');
    } finally {
      setSaving(false);
    }
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
        <h1 className="text-3xl font-bold text-foreground">Custom Email Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize the tracking notification emails sent to your customers.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Email Template
          </CardTitle>
          <CardDescription>
            Configure the subject and body of tracking notification emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email Subject</Label>
            <Input
              value={settings.email_subject}
              onChange={(e) => setSettings({ ...settings, email_subject: e.target.value })}
              placeholder="Your shipment is on its way!"
            />
          </div>
          <div className="space-y-2">
            <Label>Email Message</Label>
            <Textarea
              value={settings.email_message}
              onChange={(e) => setSettings({ ...settings, email_message: e.target.value })}
              placeholder="Your order has been shipped..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              The tracking link and tracking number will be automatically appended to this message.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Support Contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Reply-To Email</Label>
            <Input
              type="email"
              value={settings.support_email}
              onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              placeholder="support@your-store.com"
            />
            <p className="text-xs text-muted-foreground">
              Customers who reply to tracking emails will reach this address.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
        {saving ? 'Saving...' : 'Save Email Settings'}
      </Button>
    </div>
  );
};

export default CustomEmailSettingsPage;
