
import React from 'react';
import { FileText } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface LabelPreviewProps {
  blobUrl: string | null;
}

const LabelPreview: React.FC<LabelPreviewProps> = ({ blobUrl }) => {
  return (
    <>
      {blobUrl ? (
        <AspectRatio ratio={8.5/11} className="w-full max-h-[500px]">
          <iframe 
            src={blobUrl} 
            className="w-full h-full" 
            title="Label Preview"
            sandbox="allow-same-origin"
          />
        </AspectRatio>
      ) : (
        <div className="flex flex-col items-center justify-center h-full w-full">
          <FileText className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500">Loading preview...</p>
        </div>
      )}
    </>
  );
};

export default LabelPreview;
