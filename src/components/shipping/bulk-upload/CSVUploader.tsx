
import React, { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface CSVUploaderProps {
  onFileUpload: (content: string, filename: string) => void;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({ onFileUpload }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onFileUpload(content, file.name);
      }
    };
    reader.onerror = () => {
      toast.error('Error reading file');
    };
    reader.readAsText(file);
  }, [onFileUpload]);

  return (
    <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Upload CSV File</h3>
            <p className="text-sm text-gray-600">
              Upload a CSV file with your shipment data
            </p>
          </div>
          <div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose CSV File
                </span>
              </Button>
            </label>
          </div>
          <div className="text-xs text-gray-500">
            <p>Required columns: to_name, to_street1, to_city, to_state, to_zip, weight, length, width, height</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVUploader;
