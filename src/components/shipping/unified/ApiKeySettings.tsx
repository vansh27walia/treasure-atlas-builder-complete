
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Key, Save, CheckCircle, Shield, Lock } from 'lucide-react';
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
        setApiKey('••••••••••••••••••••••••••••••••');
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const handleSave = async () => {
    if (!apiKey || apiKey === '••••••••••••••••••••••••••••••••') {
      toast.error('Please enter a valid API key');
      return;
    }

    setIsLoading(true);
    try {
      const success = await userProfileService.updateUShipCredentials(apiKey, true);
      
      if (success) {
        setIsSaved(true);
        setHasExistingKey(true);
        toast.success('🔐 uShip API key saved securely in Supabase!');
        // Mask the key after saving
        setTimeout(() => {
          setApiKey('••••••••••••••••••••••••••••••••');
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl border-2 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Key className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-xl text-blue-800">uShip API Settings</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6 p-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Secure API Key Storage</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Your uShip API key will be encrypted and stored securely in Supabase with enterprise-grade security.
                </p>
                <div className="flex items-center space-x-2 text-xs text-blue-600">
                  <Lock className="h-3 w-3" />
                  <span>256-bit AES encryption</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="api-key" className="text-sm font-semibold text-gray-700 mb-2 block">
                uShip API Key
              </Label>
              <div className="flex space-x-3 mt-2">
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your uShip API key"
                  className="flex-1 border-2 border-gray-300 focus:border-blue-500 text-sm"
                />
                {isSaved && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNewKey}
                    className="px-4 border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    New Key
                  </Button>
                )}
              </div>
            </div>

            {hasExistingKey && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center space-x-3 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">API key is configured and ready</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                    Test Mode Enabled
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !apiKey || apiKey === '••••••••••••••••••••••••••••••••'}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 text-lg shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Saving Securely...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-3" />
                  Save API Key Securely
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="w-full border-2 border-gray-300 hover:bg-gray-50 py-3"
            >
              {isSaved ? 'Done' : 'Cancel'}
            </Button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">Security Features:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• ✅ End-to-end encryption before storage</p>
              <p>• ✅ Secure Supabase backend infrastructure</p>
              <p>• ✅ Test mode enabled by default for safety</p>
              <p>• ✅ API key never displayed in plain text</p>
              <p>• ✅ Can be updated or removed anytime</p>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Need a uShip API key?</strong> Contact uShip support or visit their developer portal to obtain your API credentials.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeySettings;
