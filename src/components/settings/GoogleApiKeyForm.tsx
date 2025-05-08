
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

const GoogleApiKeyForm = () => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid Google API key');
      return;
    }

    setIsLoading(true);
    try {
      // Store API key in Supabase secrets via Edge Function
      const { error } = await supabase.functions.invoke('save-google-api-key', {
        body: { apiKey }
      });

      if (error) throw error;

      toast.success('Google API key saved successfully');
      setApiKey(''); // Clear the input after successful save
    } catch (error) {
      console.error('Error saving Google API key:', error);
      toast.error('Failed to save Google API key');
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
        <p className="text-sm text-gray-600 mb-4">
          Enter your Google Places API key to enable address autocomplete functionality.
          This key will be securely stored and only used for address lookups.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="google-api-key" className="text-sm font-medium">
              Google Places API Key
            </label>
            <Input
              id="google-api-key"
              type="password"
              placeholder="Enter your Google API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveApiKey} 
          disabled={isLoading || !apiKey.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Saving...' : 'Save API Key'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GoogleApiKeyForm;
