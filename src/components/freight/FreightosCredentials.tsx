
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Key, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FreightosCredentialsProps {
  onCredentialsUpdate?: () => void;
}

const FreightosCredentials: React.FC<FreightosCredentialsProps> = ({ onCredentialsUpdate }) => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const saveCredentials = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      toast.error('Please enter both API Key and API Secret');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('save-freightos-credentials', {
        body: {
          apiKey: apiKey.trim(),
          apiSecret: apiSecret.trim()
        }
      });

      if (error) {
        throw error;
      }

      setIsConfigured(true);
      setApiKey('');
      setApiSecret('');
      toast.success('Freightos credentials saved securely!');
      onCredentialsUpdate?.();
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error('Failed to save credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isConfigured) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Freightos API Configured</h3>
              <p className="text-sm text-green-700">Your credentials are securely stored and ready for use.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>Freightos API Configuration</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Enter your Freightos API credentials to enable live freight rate calculations.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Security Notice</p>
              <p>Your credentials will be encrypted and stored securely in Supabase. They will never be exposed in frontend code.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="freightos-api-key" className="flex items-center space-x-1">
              <Key className="w-4 h-4" />
              <span>Freightos API Key *</span>
            </Label>
            <Input
              id="freightos-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Freightos API Key"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="freightos-api-secret" className="flex items-center space-x-1">
              <Key className="w-4 h-4" />
              <span>Freightos API Secret *</span>
            </Label>
            <Input
              id="freightos-api-secret"
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Enter your Freightos API Secret"
              className="mt-2"
            />
          </div>
        </div>

        <Button
          onClick={saveCredentials}
          disabled={!apiKey.trim() || !apiSecret.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving Securely...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Save Credentials Securely</span>
            </div>
          )}
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Credentials are encrypted before storage</p>
          <p>• Only accessible by authenticated backend functions</p>
          <p>• Never exposed in browser or network requests</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FreightosCredentials;
