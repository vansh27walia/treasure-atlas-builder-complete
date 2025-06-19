
-- Clear all existing tracking and shipment data to start fresh
DELETE FROM public.external_trackings;
DELETE FROM public.shipments;
DELETE FROM public.shipment_records;
DELETE FROM public.bulk_label_uploads;
DELETE FROM public.bulk_label_batches;
DELETE FROM public.shipping_label_files;

-- Reset any auto-increment sequences if needed
-- This ensures we start with clean IDs
