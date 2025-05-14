
import React from 'react';
import { Mail, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LabelShareProps {
  handleEmailLabel: () => void;
  handleSaveToAccount: () => void;
  isEmailSending: boolean;
  isSaving: boolean;
}

const LabelShare: React.FC<LabelShareProps> = ({ 
  handleEmailLabel, 
  handleSaveToAccount,
  isEmailSending, 
  isSaving 
}) => {
  return (
    <div className="space-y-6">
      <div className="border rounded-md p-4">
        <h4 className="font-medium mb-2">Email Label</h4>
        <p className="text-sm text-gray-600 mb-4">
          Send this label to your email address for easy access later
        </p>
        <Button 
          onClick={handleEmailLabel}
          disabled={isEmailSending}
          className="w-full"
        >
          <Mail className="mr-2 h-4 w-4" />
          {isEmailSending ? 'Sending...' : 'Email to My Inbox'}
        </Button>
      </div>
      
      <div className="border rounded-md p-4">
        <h4 className="font-medium mb-2">Save to Account</h4>
        <p className="text-sm text-gray-600 mb-4">
          Save this label to your account for easy access later
        </p>
        <Button 
          onClick={handleSaveToAccount}
          disabled={isSaving}
          className="w-full"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save to My Labels'}
        </Button>
      </div>
    </div>
  );
};

export default LabelShare;
