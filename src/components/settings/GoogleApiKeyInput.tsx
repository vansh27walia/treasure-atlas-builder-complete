
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { MapPin } from 'lucide-react';

const GoogleApiKeyInput: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Check for existing API key in localStorage
  const existingKey = localStorage.getItem('google_api_key');
  
  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid Google Places API key');
      return;
    }
    
    setIsSaving(true);
    try {
      // Save the key to localStorage
      localStorage.setItem('google_api_key', apiKey);
      toast.success('Google Places API key saved successfully');
      
      // Test loading the API
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initTestMap`;
      
      // Create a global callback function to verify the API loaded correctly
      window.initTestMap = () => {
        toast.success('Google Maps API loaded successfully');
        delete window.initTestMap; // Clean up
      };
      
      script.onerror = () => {
        toast.error('Invalid API key or API access issue');
        // Don't remove the key as it might be a temporary network issue
      };
      
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error saving Google API key:', error);
      toast.error('Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleRemoveKey = () => {
    localStorage.removeItem('google_api_key');
    setApiKey('');
    toast.success('Google Places API key removed');
  };
  
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Google Places API Configuration</CardTitle>
        </div>
        <CardDescription>
          Enter your Google Places API key to enable address autocomplete
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <Input
              type={isVisible ? "text" : "password"}
              placeholder="Enter Google Places API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
            />
            <div className="flex justify-between mt-2">
              <div className="text-xs text-gray-500">
                {existingKey ? 'API Key is currently set' : 'No API Key configured'}
              </div>
              <button 
                type="button"
                className="text-xs text-blue-600 hover:underline"
                onClick={() => setIsVisible(!isVisible)}
              >
                {isVisible ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p>To get a Google Places API key:</p>
            <ol className="list-decimal ml-5 mt-1 space-y-1 text-xs">
              <li>Go to the <a href="https://console.cloud.google.com/google/maps-apis/overview" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
              <li>Create or select a project</li>
              <li>Enable the Places API and Maps JavaScript API</li>
              <li>Create an API key with appropriate restrictions</li>
            </ol>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-3">
        {existingKey && (
          <Button 
            variant="outline" 
            onClick={handleRemoveKey}
          >
            Remove Key
          </Button>
        )}
        <Button 
          onClick={handleSaveKey}
          disabled={isSaving || !apiKey.trim()}
        >
          {isSaving ? 'Saving...' : 'Save API Key'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GoogleApiKeyInput;
