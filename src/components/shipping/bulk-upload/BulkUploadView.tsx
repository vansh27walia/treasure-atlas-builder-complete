import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UploadCloud } from 'lucide-react';
import Papa from 'papaparse';
import { BulkShipment, CustomsInfo, ShippingAddress } from '@/types/shipping';
import { useToast } from "@/components/ui/use-toast"
import { generateUUID } from '@/lib/utils';
import BulkShipmentsList from './BulkShipmentsList';
import { useBulkShippingProcessor } from '@/hooks/useBulkShippingProcessor';
import { ShippingAddressForm } from '../address/ShippingAddressForm';
import { useSettings } from '@/hooks/useSettings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries } from 'countries-list';
import { CountryDropdown } from '../address/CountryDropdown';
import { PackageDetailsForm } from '../package/PackageDetailsForm';
import { Package } from 'lucide-react';
import { BulkResults } from './BulkResults';
import { Skeleton } from '@/components/ui/skeleton';

interface BulkUploadViewProps {
  onComplete: (shipments: BulkShipment[]) => void;
  onCancel: () => void;
}

type UploadStep = 'upload' | 'editing' | 'rates' | 'complete';

const BulkUploadView: React.FC<BulkUploadViewProps> = ({ 
  onComplete,
  onCancel
}) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [shipments, setShipments] = useState<BulkShipment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload');
  const [pickupAddress, setPickupAddress] = useState<ShippingAddress | null>(null);
  const [isPickupAddressValid, setIsPickupAddressValid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sortField, setSortField] = useState<string>('recipient');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [filters, setFilters] = useState<{ status: string }>({ status: 'all' });
  const { settings } = useSettings();
  const { toast } = useToast();

  const {
    results,
    processShipments,
    updateShipmentRate,
    uploadStatus
  } = useBulkShippingProcessor(shipments, pickupAddress);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setCsvFile(file);
      setUploadError(null);
    }
  };

  const parseCSV = useCallback(() => {
    if (!csvFile) {
      setUploadError('Please select a CSV file.');
      return;
    }

    setIsProcessing(true);
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsProcessing(false);
        if (results.errors.length > 0) {
          setUploadError(`CSV Parsing Error: ${results.errors[0].message}`);
          return;
        }

        const parsedData = results.data;
        if (!Array.isArray(parsedData)) {
          setUploadError('Failed to parse CSV data.');
          return;
        }

        const newShipments: BulkShipment[] = parsedData.map((row: any, index: number) => {
          const shipmentId = generateUUID();
          const toAddress = {
            name: row.to_name || '',
            company: row.to_company || '',
            street1: row.to_street1 || '',
            street2: row.to_street2 || '',
            city: row.to_city || '',
            state: row.to_state || '',
            zip: row.to_zip || '',
            country: row.to_country || 'US',
            phone: row.to_phone || '',
            email: row.to_email || '',
            is_residential: row.to_residential === 'true'
          };

          const parcel = {
            length: parseFloat(row.parcel_length) || 9,
            width: parseFloat(row.parcel_width) || 6,
            height: parseFloat(row.parcel_height) || 1,
            weight: parseFloat(row.parcel_weight) || 8,
            predefined_package: row.parcel_predefined_package || null
          };

          return {
            id: shipmentId,
            row: index + 1,
            recipient: row.to_name || 'Recipient',
            customer_name: row.customer_name || '',
            customer_address: row.customer_address || '',
            customer_phone: row.customer_phone || '',
            customer_email: row.customer_email || '',
            customer_company: row.customer_company || '',
            details: {
              to_address: toAddress,
              parcel: parcel
            },
            status: 'pending_rates',
            rate: 0,
            total_cost: 0,
            rates: [],
            insurance_amount: parseFloat(row.insurance_amount) || 0,
            insurance_cost: 0,
            selected_rate_id: null,
            shipment_data: row
          };
        });

        setShipments(newShipments);
        setCurrentStep('editing');
      },
      error: (error) => {
        setIsProcessing(false);
        setUploadError(`CSV Parsing Error: ${error.message}`);
      }
    });
  }, [csvFile, setShipments, setUploadError, setCurrentStep, setIsProcessing]);

  const handlePickupAddressChange = (address: ShippingAddress, isValid: boolean) => {
    setPickupAddress(address);
    setIsPickupAddressValid(isValid);
  };

  const handleStartRateFetching = async () => {
    if (!pickupAddress) {
      toast({
        title: "Error",
        description: "Please enter a valid pickup address.",
        variant: "destructive",
      })
      return;
    }

    if (!isPickupAddressValid) {
       toast({
        title: "Error",
        description: "Please ensure the pickup address is valid.",
        variant: "destructive",
      })
      return;
    }

    if (!shipments || shipments.length === 0) {
      toast({
        title: "Error",
        description: "No shipments to process. Please upload a CSV file.",
        variant: "destructive",
      })
      return;
    }

    setCurrentStep('rates');
    processShipments(pickupAddress);
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleShipmentSelect = (shipmentId: string) => {
    setSelectedShipments(prev => {
      if (prev.includes(shipmentId)) {
        return prev.filter(id => id !== shipmentId);
      } else {
        return [...prev, shipmentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedShipments.length === shipments.length) {
      setSelectedShipments([]);
    } else {
      setSelectedShipments(shipments.map(shipment => shipment.id));
    }
  };

  const handleRateChange = (shipmentId: string, rateId: string) => {
    updateShipmentRate(shipmentId, rateId);
  };

  const handleCustomsUpdate = (shipmentId: string, customsInfo: CustomsInfo) => {
    // Update the shipment with customs information
    // This function should be passed down from the parent component that manages the shipments
    // For now, we'll just log it
    console.log('Customs updated for shipment:', shipmentId, customsInfo);
  };

  const handleEditShipment = (shipmentId: string) => {
    // Implement edit shipment logic here
    console.log('Editing shipment:', shipmentId);
  };

  const handleStatusFilterChange = (status: string) => {
    setFilters({ status });
  };

  const getFilteredShipments = useMemo(() => {
    let filtered = [...shipments];

    if (filters.status !== 'all') {
      filtered = filtered.filter(shipment => shipment.status === filters.status);
    }

    return filtered.sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const stringA = String(aValue).toUpperCase();
      const stringB = String(bValue).toUpperCase();

      if (stringA < stringB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (stringA > stringB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [shipments, sortField, sortDirection, filters]);

  return (
    <div className="space-y-6">
      {currentStep === 'upload' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <UploadCloud className="h-12 w-12 text-gray-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Upload CSV File</h2>
            <p className="text-gray-500 mb-4">
              Select a CSV file containing shipment details to get started.
            </p>
            <Label htmlFor="csv-upload" className="cursor-pointer bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors duration-200">
              {csvFile ? `File Selected: ${csvFile.name}` : 'Select CSV File'}
            </Label>
            <Input
              type="file"
              id="csv-upload"
              className="hidden"
              accept=".csv"
              onChange={handleFileChange}
            />
            {uploadError && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
            {isProcessing && (
              <div className="mt-4">
                <p className="text-gray-500">Processing CSV file...</p>
                <Skeleton className="w-[300px] h-[20px] mt-2" />
              </div>
            )}
            <Button onClick={parseCSV} disabled={!csvFile || isProcessing} className="mt-4">
              Parse CSV
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 'editing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xl font-semibold mb-4">Enter Pickup Address</h3>
                {settings?.default_shipping_country && (
                  <ShippingAddressForm
                    defaultCountry={settings?.default_shipping_country}
                    onChange={handlePickupAddressChange}
                  />
                )}
                {!settings?.default_shipping_country && (
                  <ShippingAddressForm
                    onChange={handlePickupAddressChange}
                  />
                )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Shipments</h3>
              <p className="text-sm text-gray-500">Review and edit the shipments you want to process.</p>
              <BulkShipmentsList
                shipments={shipments}
                onRateSelect={handleRateChange}
                onEditShipment={handleEditShipment}
                pickupAddress={pickupAddress}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                selectedShipments={selectedShipments}
                onShipmentSelect={handleShipmentSelect}
                onSelectAll={handleSelectAll}
                filters={filters}
                onCustomsUpdate={handleCustomsUpdate}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'rates' && (
        <>
          <BulkResults results={results} onRateChange={handleRateChange} />
        </>
      )}

      {(currentStep === 'editing' || currentStep === 'rates') && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {currentStep === 'editing' && (
            <Button onClick={handleStartRateFetching} disabled={!isPickupAddressValid}>
              Fetch Rates
            </Button>
          )}
          {currentStep === 'rates' && (
            <Button onClick={() => onComplete(shipments)} disabled={uploadStatus === 'creating-labels'}>
              {uploadStatus === 'creating-labels' ? 'Creating Labels...' : 'Create Labels'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkUploadView;
