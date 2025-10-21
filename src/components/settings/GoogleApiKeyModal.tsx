import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Key, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GoogleApiKeyModalProps {
  trigger?: React.ReactNode;
}

const GoogleApiKeyModal: React.FC<GoogleApiKeyModalProps> = ({ trigger }) => {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid Google Maps API key');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.functions.invoke('save-google-api-key', {
        body: { apiKey: apiKey.trim() }
      });

      if (error) {
        console.error('Error saving API key:', error);
        toast.error('Failed to save API key. Please try again.');
      } else {
        toast.success('Google Maps API key saved successfully!');
        setApiKey('');
        setOpen(false);
        
        // Reload the page to reinitialize Google Maps with new key
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('An error occurred while saving the API key');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Key className="h-4 w-4" />
            Configure Google Maps API
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Google Maps API Key
          </DialogTitle>
          <DialogDescription>
            Enter your Google Maps API key to enable address autocomplete across the application
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Your API key will be securely stored in Supabase. This key enables Google Maps autocomplete for address entry.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="api-key">Google Maps API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your Google Maps API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="text-xs text-muted-foreground space-y-2">
            <p className="font-medium">To get your API key:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Visit <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a></li>
              <li>Create or select a project</li>
              <li>Enable "Places API" and "Maps JavaScript API"</li>
              <li>Create credentials (API Key)</li>
              <li>Set appropriate restrictions for security</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !apiKey.trim()}>
            {isSaving ? 'Saving...' : 'Save API Key'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoogleApiKeyModal;
