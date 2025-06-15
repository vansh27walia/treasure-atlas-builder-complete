
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Key, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { ApiKeyService } from '@/services/ApiKeyService';

interface ApiKeySetupProps {
  onApiKeySet: (hasApiKey: boolean) => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);

  useEffect(() => {
    checkExistingApiKey();
  }, []);

  const checkExistingApiKey = async () => {
    setIsCheckingKey(true);
    try {
      const existingKey = await ApiKeyService.getApiKey('openai');
      const keyExists = !!existingKey;
      setHasExistingKey(keyExists);
      onApiKeySet(keyExists);
    } catch (error) {
      console.error('Error checking existing API key:', error);
    } finally {
      setIsCheckingKey(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      toast.error('OpenAI API keys should start with "sk-"');
      return;
    }

    setIsLoading(true);
    try {
      const success = await ApiKeyService.saveApiKey('openai', apiKey.trim());
      
      if (success) {
        toast.success('API key saved successfully');
        setHasExistingKey(true);
        setApiKey('');
        onApiKeySet(true);
      } else {
        toast.error('Failed to save API key');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveApiKey = async () => {
    setIsLoading(true);
    try {
      const success = await ApiKeyService.deleteApiKey('openai');
      
      if (success) {
        toast.success('API key removed successfully');
        setHasExistingKey(false);
        onApiKeySet(false);
      } else {
        toast.error('Failed to remove API key');
      }
    } catch (error) {
      console.error('Error removing API key:', error);
      toast.error('Failed to remove API key');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingKey) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Checking API key status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          OpenAI API Key Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasExistingKey ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                OpenAI API key is configured and ready for batch processing.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleRemoveApiKey} 
                variant="outline" 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Removing...' : 'Remove API Key'}
              </Button>
              <Button 
                onClick={() => setHasExistingKey(false)} 
                variant="outline"
                className="flex-1"
              >
                Update API Key
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Enter your OpenAI API key to enable batch label processing. 
                Your key will be encrypted and stored securely.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="apiKey">OpenAI API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={handleSaveApiKey} 
              disabled={isLoading || !apiKey.trim()}
              className="w-full"
            >
              {isLoading ? 'Saving...' : 'Save API Key'}
            </Button>
            
            <div className="text-sm text-gray-600">
              <p>Get your OpenAI API key from: <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                platform.openai.com/api-keys
              </a></p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiKeySetup;
