
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Key, Save, Shield, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { userProfileService } from '@/services/UserProfileService';

interface ApiKeyManagementProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySaved: () => void;
}

const ApiKeyManagement: React.FC<ApiKeyManagementProps> = ({ 
  isOpen, 
  onClose, 
  onApiKeySaved 
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testMode, setTestMode] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkExistingApiKey();
    }
  }, [isOpen]);

  const checkExistingApiKey = async () => {
    try {
      const credentials = await userProfileService.getUShipCredentials();
      if (credentials?.apiKey) {
        setIsConfigured(true);
        setTestMode(credentials.testMode);
        // Mask the existing key for security
        setApiKey('••••••••••••••••••••••••••••••••');
      }
    } catch (error) {
      console.error('Error checking existing API key:', error);
    }
  };

  const handleSave = async () => {
    if (!apiKey || apiKey === '••••••••••••••••••••••••••••••••') {
      toast.error('Please enter a valid API key');
      return;
    }

    if (apiKey.length < 20) {
      toast.error('API key appears to be too short. Please check and try again.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await userProfileService.updateUShipCredentials(apiKey.trim(), testMode);
      
      if (success) {
        setIsConfigured(true);
        toast.success('🔐 API key saved securely in Supabase!');
        onApiKeySaved();
        // Mask the key after saving
        setTimeout(() => {
          setApiKey('••••••••••••••••••••••••••••••••');
          setShowApiKey(false);
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
    setIsConfigured(false);
    setShowApiKey(true);
  };

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="bg-blue-100 p-2 rounded-full">
              <Key className="h-5 w-5 text-blue-600" />
            </div>
            <span>Secure API Key Management</span>
          </DialogTitle>
          <DialogDescription>
            Securely store your uShip API key to enable live shipping rates and booking functionality.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Security Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <h4 className="font-semibold text-blue-800 mb-1">Enterprise Security</h4>
                  <p className="text-blue-700 mb-2">
                    Your API key is encrypted with 256-bit AES encryption before being stored in Supabase.
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-blue-600">
                    <Lock className="h-3 w-3" />
                    <span>End-to-end encrypted • Never exposed in frontend</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Key Input */}
          <div className="space-y-3">
            <Label htmlFor="api-key" className="text-sm font-semibold">
              uShip API Key
            </Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your uShip API key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={toggleShowApiKey}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {isConfigured && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNewKey}
                  className="px-4"
                >
                  Update
                </Button>
              )}
            </div>
          </div>

          {/* Status Indicator */}
          {isConfigured && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">API Key Configured</p>
                    <p className="text-sm text-green-700">Ready for live shipping operations</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {testMode ? 'Test Mode' : 'Live Mode'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Mode Notice */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-800">
                    <strong>Test Mode Enabled:</strong> No billing will occur. Perfect for testing and development.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !apiKey || apiKey === '••••••••••••••••••••••••••••••••'}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Saving Securely...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save API Key Securely
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-6"
            >
              {isConfigured ? 'Done' : 'Cancel'}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1 bg-gray-50 rounded-lg p-3">
            <p className="font-medium text-gray-700">Security Features:</p>
            <p>• ✅ 256-bit AES encryption before storage</p>
            <p>• ✅ Stored in secure Supabase backend</p>
            <p>• ✅ Never exposed in browser or network requests</p>
            <p>• ✅ Test mode enabled by default for safety</p>
            <p>• ✅ Can be updated or removed anytime</p>
          </div>

          {/* Getting API Key Help */}
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">
                <strong>Need a uShip API key?</strong> Contact uShip support or visit their developer portal to obtain your API credentials for accessing their shipping services.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyManagement;
