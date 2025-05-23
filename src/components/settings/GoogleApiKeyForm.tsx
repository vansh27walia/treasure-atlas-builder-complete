
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

const GoogleApiKeyForm = () => {
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
            The API key is securely stored in Supabase and automatically used for address verification.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleApiKeyForm;
