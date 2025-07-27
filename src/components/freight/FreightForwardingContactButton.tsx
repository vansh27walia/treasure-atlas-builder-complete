
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, MessageCircle, Clock } from 'lucide-react';

interface FreightForwardingContactButtonProps {
  onContact: () => void;
}

const FreightForwardingContactButton: React.FC<FreightForwardingContactButtonProps> = ({ onContact }) => {
  return (
    <Card className="mt-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Phone className="w-5 h-5" />
          Need Help with Freight Forwarding?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-blue-800 text-sm">
          Freight forwarding requires specialized handling and documentation. Our experts are ready to help you with your shipment.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={onContact}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Call Us
          </Button>
          
          <Button
            onClick={onContact}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Email Us
          </Button>
          
          <Button
            onClick={onContact}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Live Chat
          </Button>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-100 p-2 rounded-lg">
          <Clock className="w-4 h-4" />
          Available Mon-Fri 9AM-6PM EST
        </div>
      </CardContent>
    </Card>
  );
};

export default FreightForwardingContactButton;
