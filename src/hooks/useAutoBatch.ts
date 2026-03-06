import { useState } from 'react';
import { toast } from 'sonner';
import { ShopifyOrderRaw, mapShopifyOrderToRow, MappedShipmentRow, rowsToCSV } from '@/utils/shopifyHeaderMapping';
import { DimensionData } from '@/components/shipping/DimensionModal';
import { ReviewableOrder } from '@/components/shipping/ShopifyOrderReviewModal';

interface AutoBatchState {
  isProcessing: boolean;
  error: string | null;
}

export const useAutoBatch = () => {
  const [state, setState] = useState<AutoBatchState>({ isProcessing: false, error: null });

  const processShopifyOrders = async (
    orders: ShopifyOrderRaw[], dimensions: DimensionData, applyToAll: boolean
  ): Promise<string | null> => {
    setState({ isProcessing: true, error: null });
    try {
      let weight = dimensions.weight, length = dimensions.length, width = dimensions.width, height = dimensions.height;
      if (dimensions.weightUnit === 'kg') weight *= 2.20462;
      if (dimensions.dimensionUnit === 'cm') { length /= 2.54; width /= 2.54; height /= 2.54; }

      const dimObj = { length, width, height, weight };
      const mappedRows = orders.map(order =>
        mapShopifyOrderToRow(order, applyToAll ? dimObj : { ...dimObj, weight: order.total_weight > 0 ? order.total_weight : weight })
      );
      const validRows = mappedRows.filter(r => r.to_name && r.to_street1 && r.to_city && r.to_state && r.to_zip);
      if (validRows.length === 0) throw new Error('No valid orders to process.');
      if (validRows.length < mappedRows.length) toast.warning(`${mappedRows.length - validRows.length} orders skipped`);

      const csvContent = rowsToCSV(validRows);
      sessionStorage.setItem('shopify_auto_csv', csvContent);
      sessionStorage.setItem('shopify_auto_batch', 'true');
      sessionStorage.setItem('shopify_order_count', validRows.length.toString());
      setState({ isProcessing: false, error: null });
      toast.success(`${validRows.length} orders prepared!`);
      return csvContent;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setState({ isProcessing: false, error: msg });
      toast.error(msg);
      return null;
    }
  };

  /** Process already-reviewed/approved orders directly into CSV */
  const processReviewedOrders = async (orders: ReviewableOrder[]): Promise<string | null> => {
    setState({ isProcessing: true, error: null });
    try {
      const rows: MappedShipmentRow[] = orders.map(o => ({
        to_name: o.customer_name,
        to_company: '',
        to_street1: o.to_street1,
        to_street2: o.to_street2,
        to_city: o.to_city,
        to_state: o.to_state,
        to_zip: o.to_zip,
        to_country: o.to_country,
        to_phone: o.phone,
        to_email: o.email,
        weight: o.weight,
        length: o.length,
        width: o.width,
        height: o.height,
        reference: o.order_id,
      }));

      const validRows = rows.filter(r => r.to_name && r.to_street1 && r.to_city && r.to_state && r.to_zip);
      if (validRows.length === 0) throw new Error('No valid orders.');

      // Build a mapping of order_id (reference) → shopify metadata for fulfillment sync
      const shopifyOrderMap: Record<string, { shopify_order_id: string; shop: string }> = {};
      orders.forEach(o => {
        if (o.shopify_order_id && o.shop) {
          shopifyOrderMap[o.order_id] = {
            shopify_order_id: o.shopify_order_id,
            shop: o.shop,
          };
        }
      });

      const csvContent = rowsToCSV(validRows);
      sessionStorage.setItem('shopify_auto_csv', csvContent);
      sessionStorage.setItem('shopify_auto_batch', 'true');
      sessionStorage.setItem('shopify_order_count', validRows.length.toString());
      // Store Shopify order mapping so bulk label creation can trigger fulfillment sync
      if (Object.keys(shopifyOrderMap).length > 0) {
        sessionStorage.setItem('shopify_order_map', JSON.stringify(shopifyOrderMap));
      }
      setState({ isProcessing: false, error: null });
      toast.success(`${validRows.length} orders confirmed! Fetching rates...`);
      return csvContent;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setState({ isProcessing: false, error: msg });
      toast.error(msg);
      return null;
    }
  };

  return { ...state, processShopifyOrders, processReviewedOrders };
};
