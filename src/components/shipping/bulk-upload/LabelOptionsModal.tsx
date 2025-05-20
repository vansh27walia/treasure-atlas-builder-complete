
import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/sonner';
import { Check, Printer, Mail } from 'lucide-react';

interface LabelOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFormatSelect: (format: string) => void;
  onEmailLabels: (email: string) => void;
  shipmentCount: number;
}

const LabelOptionsModal: React.FC<LabelOptionsModalProps> = ({
  open,
  onOpenChange,
  onFormatSelect,
  onEmailLabels,
  shipmentCount
}) => {
  const [selectedFormat, setSelectedFormat] = useState('4x6');
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'download' | 'email'>('download');

  const handleDownload = () => {
    onFormatSelect(selectedFormat);
    onOpenChange(false);
    toast.success(`Labels will be downloaded in ${selectedFormat} format`);
  };

  const handleSendEmail = () => {
    if (!email) {
      toast.error('Please enter a valid email address');
      return;
    }
    onEmailLabels(email);
    onOpenChange(false);
    toast.success(`Labels sent to ${email}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Label Options</DialogTitle>
        </DialogHeader>
        <div className="flex space-x-2 border-b mb-4">
          <button
            className={`pb-2 px-4 ${activeTab === 'download' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('download')}
          >
            <Printer className="h-4 w-4 inline mr-1" />
            Download
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'email' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('email')}
          >
            <Mail className="h-4 w-4 inline mr-1" />
            Email
          </button>
        </div>

        {activeTab === 'download' ? (
          <div className="space-y-4">
            <div>
              <Label className="text-base">Label Format</Label>
              <RadioGroup 
                value={selectedFormat} 
                onValueChange={setSelectedFormat} 
                className="mt-2 space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4x6" id="r1" />
                  <Label htmlFor="r1" className="cursor-pointer">4 × 6 (Thermal Label)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="letter" id="r2" />
                  <Label htmlFor="r2" className="cursor-pointer">8.5 × 11 (Letter)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="a4" id="r3" />
                  <Label htmlFor="r3" className="cursor-pointer">A4 Paper</Label>
                </div>
              </RadioGroup>
            </div>
            <p className="text-sm text-gray-500">
              {shipmentCount} shipping label{shipmentCount !== 1 ? 's' : ''} will be downloaded
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-base">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="your@email.com" 
                className="mt-1"
              />
            </div>
            <p className="text-sm text-gray-500">
              {shipmentCount} shipping label{shipmentCount !== 1 ? 's' : ''} will be sent to this email
            </p>
          </div>
        )}

        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {activeTab === 'download' ? (
            <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
              <Check className="mr-2 h-4 w-4" /> Download Labels
            </Button>
          ) : (
            <Button onClick={handleSendEmail} className="bg-blue-600 hover:bg-blue-700">
              <Mail className="mr-2 h-4 w-4" /> Send Email
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LabelOptionsModal;
