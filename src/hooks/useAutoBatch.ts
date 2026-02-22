import { useState } from 'react';
import { toast } from 'sonner';
import { ShopifyOrderRaw, mapShopifyOrderToRow, rowsToCSV } from '@/utils/shopifyHeaderMapping';
import { DimensionData } from '@/components/shipping/DimensionModal';
import { addressService } from '@/services/AddressService';

interface AutoBatchState {
  isProcessing: boolean;
  error: string | null;
}

/**
 * Hook for Shopify auto-batch flow.
 * Converts Shopify orders → internal CSV → stores in sessionStorage → navigates to /bulk-upload.
 * The existing BulkUpload flow picks up the CSV automatically, skipping manual upload + header mapping.
 */
export const useAutoBatch = () => {
  const [state, setState] = useState<AutoBatchState>({
    isProcessing: false,
    error: null,
  });

  /**
   * Process Shopify orders:
   * 1. Apply header mapping automatically
   * 2. Apply dimensions from modal
   * 3. Generate internal CSV (in memory)
   * 4. Store in sessionStorage for BulkUpload to pick up
   * 5. Navigate to /bulk-upload
   */
  const processShopifyOrders = async (
    orders: ShopifyOrderRaw[],
    dimensions: DimensionData,
    applyToAll: boolean
  ): Promise<string | null> => {
    setState({ isProcessing: true, error: null });

    try {
      // 1. Get pickup address
      const pickupAddress = await addressService.getDefaultFromAddress();
      if (!pickupAddress) {
        const addresses = await addressService.getSavedAddresses();
        if (addresses.length === 0) {
          throw new Error('No pickup address found. Please set one in Settings first.');
        }
      }

      // 2. Convert units if needed
      let weight = dimensions.weight;
      let length = dimensions.length;
      let width = dimensions.width;
      let height = dimensions.height;

      if (dimensions.weightUnit === 'kg') {
        weight = weight * 2.20462;
      }
      if (dimensions.dimensionUnit === 'cm') {
        length = length / 2.54;
        width = width / 2.54;
        height = height / 2.54;
      }

      // 3. Map Shopify orders → standardized rows with dimensions
      const dimObj = { length, width, height, weight };
      const mappedRows = orders.map(order =>
        mapShopifyOrderToRow(order, applyToAll ? dimObj : {
          ...dimObj,
          weight: order.total_weight > 0 ? order.total_weight : weight
        })
      );

      // 4. Validate
      const validRows = mappedRows.filter(r => r.to_name && r.to_street1 && r.to_city && r.to_state && r.to_zip);
      if (validRows.length === 0) {
        throw new Error('No valid orders to process. Check shipping addresses.');
      }

      if (validRows.length < mappedRows.length) {
        toast.warning(`${mappedRows.length - validRows.length} orders skipped due to incomplete addresses`);
      }

      // 5. Generate internal CSV (never shown to user)
      const csvContent = rowsToCSV(validRows);

      // 6. Store in sessionStorage for /bulk-upload to auto-process
      sessionStorage.setItem('shopify_auto_csv', csvContent);
      sessionStorage.setItem('shopify_auto_batch', 'true');
      sessionStorage.setItem('shopify_order_count', validRows.length.toString());

      setState({ isProcessing: false, error: null });
      toast.success(`${validRows.length} orders prepared! Redirecting to rates...`);

      return csvContent;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setState({ isProcessing: false, error: msg });
      toast.error(msg);
      return null;
    }
  };

  return {
    ...state,
    processShopifyOrders,
  };
};
