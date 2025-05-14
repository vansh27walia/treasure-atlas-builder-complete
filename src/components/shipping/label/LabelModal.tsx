
import React from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import LabelPreview from './LabelPreview';
import LabelDownload from './LabelDownload';
import LabelShare from './LabelShare';

interface LabelModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  blobUrl: string | null;
  trackingCode: string | null;
  handleDirectDownload: (format: 'pdf' | 'png' | 'zpl') => void;
  handleEmailLabel: () => void;
  handleSaveToAccount: () => void;
  isEmailSending: boolean;
  isSaving: boolean;
  selectedFormat: 'pdf' | 'png' | 'zpl';
  setSelectedFormat: (format: 'pdf' | 'png' | 'zpl') => void;
}

const LabelModal: React.FC<LabelModalProps> = ({
  isOpen,
  setIsOpen,
  blobUrl,
  trackingCode,
  handleDirectDownload,
  handleEmailLabel,
  handleSaveToAccount,
  isEmailSending,
  isSaving,
  selectedFormat,
  setSelectedFormat
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-white max-w-3xl">
        <DialogHeader>
          <DialogTitle>Shipping Label</DialogTitle>
          <DialogDescription>
            Tracking #: {trackingCode}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="download">Download</TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="min-h-[400px] flex items-center justify-center border rounded-md">
            <LabelPreview blobUrl={blobUrl} />
          </TabsContent>
          
          <TabsContent value="download">
            <LabelDownload
              handleDirectDownload={handleDirectDownload}
              selectedFormat={selectedFormat}
              setSelectedFormat={setSelectedFormat}
            />
          </TabsContent>
          
          <TabsContent value="share">
            <LabelShare
              handleEmailLabel={handleEmailLabel}
              handleSaveToAccount={handleSaveToAccount}
              isEmailSending={isEmailSending}
              isSaving={isSaving}
            />
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            <X className="mr-2 h-4 w-4" /> Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LabelModal;
