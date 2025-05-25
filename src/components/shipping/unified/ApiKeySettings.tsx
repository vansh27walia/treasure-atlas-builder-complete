
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { X, Key, Save, TestTube, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface ApiKeySettingsProps {
  onClose: () => void;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [testMode, setTestMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    setIsLoading(true);
    try {
      // Save to Supabase secure storage
      const { error } = await supabase.functions.invoke('save-uship-credentials', {
        body: {
          apiKey: apiKey.trim(),
          testMode
        }
      });

      if (error) {
        throw error;
      }

      toast.success('API credentials saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving API credentials:', error);
      toast.error('Failed to save API credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key to test');
      return;
    }

    setIsLoading(true);
    try {
      // Test the API key
      const { data, error } = await supabase.functions.invoke('test-uship-credentials', {
        body: {
          apiKey: apiKey.trim(),
          testMode
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success('API key is valid and working!');
      } else {
        toast.error('API key test failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Error testing API credentials:', error);
      toast.error('Failed to test API credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-blue-800 flex items-center">
            <Key className="mr-2 h-5 w-5" />
            uShip API Configuration
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* API Key Input */}
          <div>
            <Label htmlFor="apiKey" className="text-base font-medium">
              uShip API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your uShip API key"
              className="mt-2"
            />
            <p className="text-sm text-gray-600 mt-1">
              Your API key will be stored securely in Supabase and never exposed on the frontend.
            </p>
          </div>

          <Separator />

          {/* Test Mode Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <TestTube className="h-4 w-4 text-gray-600" />
                <Label htmlFor="testMode" className="text-base font-medium">
                  Test Mode
                </Label>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Use sandbox endpoints for testing without creating real bookings or charges.
              </p>
            </div>
            <Switch
              id="testMode"
              checked={testMode}
              onCheckedChange={setTestMode}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          <Separator />

          {/* API Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-2">uShip API Integration</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Get your API key from the uShip Developer Portal</li>
                  <li>• Test mode uses sandbox endpoints for safe testing</li>
                  <li>• Live mode creates real bookings and charges</li>
                  <li>• All credentials are encrypted and stored securely</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleTest}
              variant="outline"
              disabled={isLoading || !apiKey.trim()}
              className="flex items-center space-x-2"
            >
              <TestTube className="h-4 w-4" />
              <span>Test Connection</span>
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isLoading || !apiKey.trim()}
              className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Saving...' : 'Save Credentials'}</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ApiKeySettings;
