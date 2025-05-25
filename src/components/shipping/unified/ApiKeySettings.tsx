
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Key, Save, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { userProfileService } from '@/services/UserProfileService';

interface ApiKeySettingsProps {
  onClose: () => void;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    loadExistingCredentials();
  }, []);

  const loadExistingCredentials = async () => {
    try {
      const credentials = await userProfileService.getUShipCredentials();
      if (credentials?.apiKey) {
        setHasExistingKey(true);
        setIsSaved(true);
        // Don't show the actual key for security
        setApiKey('••••••••••••••••');
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const handleSave = async () => {
    if (!apiKey || apiKey === '••••••••••••••••') {
      toast.error('Please enter a valid API key');
      return;
    }

    setIsLoading(true);
    try {
      const success = await userProfileService.updateUShipCredentials(apiKey, true);
      
      if (success) {
        setIsSaved(true);
        setHasExistingKey(true);
        toast.success('uShip API key saved securely!');
        // Mask the key after saving
        setTimeout(() => {
          setApiKey('••••••••••••••••');
        }, 1000);
      } else {
        toast.error('Failed to save API key. Please try again.');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewKey = () => {
    setApiKey('');
    setIsSaved(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-blue-600" />
            <span>uShip API Settings</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-sm text-gray-600">
            <p>Securely store your uShip API key to enable rate fetching and booking.</p>
            <p className="mt-2">Your API key is encrypted and stored safely in Supabase.</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="api-key">uShip API Key</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your uShip API key"
                  className="flex-1"
                />
                {isSaved && (
                  <Button variant="outline" size="sm" onClick={handleNewKey}>
                    New Key
                  </Button>
                )}
              </div>
            </div>

            {hasExistingKey && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">API key is configured</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Test Mode
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !apiKey || apiKey === '••••••••••••••••'}
              className="w-full"
            >
              {isLoading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save API Key
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={onClose} className="w-full">
              {isSaved ? 'Done' : 'Cancel'}
            </Button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• API key is encrypted before storage</p>
            <p>• Test mode is enabled by default</p>
            <p>• You can update your key anytime</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeySettings;
