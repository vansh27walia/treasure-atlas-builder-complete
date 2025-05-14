
import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LabelFormatSelector from './LabelFormatSelector';

interface LabelDownloadProps {
  handleDirectDownload: (format: 'pdf' | 'png' | 'zpl') => void;
  selectedFormat: 'pdf' | 'png' | 'zpl';
  setSelectedFormat: (format: 'pdf' | 'png' | 'zpl') => void;
}

const LabelDownload: React.FC<LabelDownloadProps> = ({ 
  handleDirectDownload, 
  selectedFormat, 
  setSelectedFormat 
}) => {
  return (
    <div className="space-y-6">
      <LabelFormatSelector 
        selectedFormat={selectedFormat} 
        setSelectedFormat={setSelectedFormat} 
      />
      
      <Button 
        onClick={() => handleDirectDownload(selectedFormat)} 
        className="w-full h-12 bg-blue-600 hover:bg-blue-700"
      >
        <Download className="mr-2 h-5 w-5" />
        Download {selectedFormat.toUpperCase()} File
      </Button>
    </div>
  );
};

export default LabelDownload;
