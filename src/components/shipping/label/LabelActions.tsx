
import React from 'react';
import { Download, ExternalLink, Mail, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LabelActionsProps {
  handleDirectDownload: (format: 'pdf' | 'png' | 'zpl') => void;
  handleOpenInNewTab: () => void;
  handleEmailLabel: () => void;
  handleSaveToAccount: () => void;
  isEmailSending: boolean;
  isSaving: boolean;
  selectedFormat: 'pdf' | 'png' | 'zpl';
}

const LabelActions: React.FC<LabelActionsProps> = ({ 
  handleDirectDownload,
  handleOpenInNewTab,
  handleEmailLabel,
  handleSaveToAccount,
  isEmailSending,
  isSaving,
  selectedFormat
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Button 
        onClick={() => handleDirectDownload(selectedFormat)}
        variant="default" 
        className="bg-green-600 hover:bg-green-700 text-white h-12"
      >
        <Download className="mr-2 h-5 w-5" /> View & Download Label
      </Button>
      
      <Button 
        onClick={handleOpenInNewTab}
        variant="outline"
        className="border-gray-300 hover:bg-gray-50 h-12"
      >
        <ExternalLink className="mr-2 h-5 w-5" /> Open in New Tab
      </Button>
      
      <Button 
        onClick={handleEmailLabel}
        variant="outline"
        className="border-gray-300 hover:bg-gray-50 h-12"
        disabled={isEmailSending}
      >
        <Mail className="mr-2 h-5 w-5" /> 
        {isEmailSending ? 'Sending...' : 'Email to My Inbox'}
      </Button>
      
      <Button 
        onClick={handleSaveToAccount}
        variant="outline"
        className="border-gray-300 hover:bg-gray-50 h-12"
        disabled={isSaving}
      >
        <Save className="mr-2 h-5 w-5" /> 
        {isSaving ? 'Saving...' : 'Save to My Labels'}
      </Button>
    </div>
  );
};

export default LabelActions;
