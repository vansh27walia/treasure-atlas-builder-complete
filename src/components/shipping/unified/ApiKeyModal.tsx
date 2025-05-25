
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Key, Save, Shield, Lock } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { userProfileService } from '@/services/UserProfileService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    setIsLoading(true);
    try {
      const success = await userProfileService.updateUShipCredentials(apiKey.trim(), true);
      
      if (success) {
        toast.success('🔐 API key saved securely in Supabase!');
        onSaved();
        onClose();
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl border-2 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Key className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-xl text-blue-800">Enter API Key</span>
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
                <h4 className="font-semibold text-blue-800 mb-2">Secure Storage</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Your API key will be encrypted and stored securely in Supabase.
                </p>
                <div className="flex items-center space-x-2 text-xs text-blue-600">
                  <Lock className="h-3 w-3" />
                  <span>256-bit AES encryption</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="api-key" className="text-sm font-semibold text-gray-700 mb-2 block">
              uShip API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your uShip API key"
              className="border-2 border-gray-300 focus:border-blue-500"
            />
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !apiKey.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Saving...
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
              className="w-full border-2 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeyModal;
