
import React from 'react';
import { FileText } from 'lucide-react';

interface LabelFormatSelectorProps {
  selectedFormat: 'pdf' | 'png' | 'zpl';
  setSelectedFormat: (format: 'pdf' | 'png' | 'zpl') => void;
}

const LabelFormatSelector: React.FC<LabelFormatSelectorProps> = ({ 
  selectedFormat, 
  setSelectedFormat 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div 
        className={`p-5 border-2 rounded-md text-center cursor-pointer transition-colors
          ${selectedFormat === 'pdf' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
        `}
        onClick={() => setSelectedFormat('pdf')}
      >
        <FileText className="h-12 w-12 mx-auto mb-2 text-blue-600" />
        <h4 className="font-medium">PDF Format</h4>
        <p className="text-xs text-gray-500">Best for printing</p>
      </div>
      
      <div 
        className={`p-5 border-2 rounded-md text-center cursor-pointer transition-colors
          ${selectedFormat === 'png' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
        `}
        onClick={() => setSelectedFormat('png')}
      >
        <FileText className="h-12 w-12 mx-auto mb-2 text-green-600" />
        <h4 className="font-medium">PNG Format</h4>
        <p className="text-xs text-gray-500">Image format</p>
      </div>
      
      <div 
        className={`p-5 border-2 rounded-md text-center cursor-pointer transition-colors
          ${selectedFormat === 'zpl' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
        `}
        onClick={() => setSelectedFormat('zpl')}
      >
        <FileText className="h-12 w-12 mx-auto mb-2 text-purple-600" />
        <h4 className="font-medium">ZPL Format</h4>
        <p className="text-xs text-gray-500">For thermal printers</p>
      </div>
    </div>
  );
};

export default LabelFormatSelector;
