
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { loadGoogleMapsAPI } from '@/utils/addressUtils';

const GoogleApiKeyForm = () => {
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call the edge function to securely save the API key
      const { data, error } = await supabase.functions.invoke('save-google-api-key', {
        body: { apiKey }
      });
      
      if (error) {
        throw new Error(`Failed to save API key: ${error.message}`);
      }
      
      toast.success('Google Places API key saved successfully');
      setShowAdminDialog(false);
      setApiKey('');
      
      // Try to load Google Maps API now that we've set the key
      await loadGoogleMapsAPI();
      
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-blue-800">Google Places API Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Google Places API key is securely stored in Supabase. This key is used for address autocomplete functionality.
          </p>
          
          <div className="flex items-center">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 px-3 py-1">
              <CheckCircle className="h-4 w-4" />
              <span>API Key Configured</span>
            </Badge>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            If you need to update the API key, please contact your administrator.
          </p>
        </div>
      </CardContent>

      {/* Admin Dialog for configuring API key - normally hidden, only accessible by admins */}
      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Google Places API</DialogTitle>
            <DialogDescription>
              Enter your Google Places API key to enable address autocomplete functionality.
              This key will be securely stored in Supabase.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input 
                id="apiKey" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Google Places API key"
              />
              <p className="text-xs text-gray-500">
                Get your API key from the <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a>.
                Make sure to enable the Places API.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAdminDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveApiKey} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Saving...' : 'Save API Key'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GoogleApiKeyForm;
