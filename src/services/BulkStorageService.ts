
import { supabase } from '@/integrations/supabase/client';

export interface BulkLabelUpload {
  id: string;
  batch_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  shipment_id?: string;
  tracking_code?: string;
  upload_status: string;
  created_at: string;
  updated_at: string;
}

export interface DownloadableLabel {
  format: 'PDF' | 'PNG' | 'ZPL';
  url: string;
  fileName: string;
  trackingCode: string;
}

class BulkStorageService {
  private readonly bucketName = 'shipping-labels-2';

  /**
   * Get all bulk label uploads for the current user
   */
  async getBulkLabelUploads(batchId?: string): Promise<BulkLabelUpload[]> {
    try {
      let query = supabase
        .from('bulk_label_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (batchId) {
        query = query.eq('batch_id', batchId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Error fetching bulk uploads: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching bulk label uploads:', error);
      throw error;
    }
  }

  /**
   * Get downloadable labels grouped by tracking code
   */
  async getDownloadableLabels(batchId: string): Promise<Record<string, DownloadableLabel[]>> {
    try {
      const uploads = await this.getBulkLabelUploads(batchId);
      const labelsByTracking: Record<string, DownloadableLabel[]> = {};

      for (const upload of uploads) {
        if (!upload.tracking_code) continue;

        const { data } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(upload.file_path);

        const downloadable: DownloadableLabel = {
          format: upload.file_type as 'PDF' | 'PNG' | 'ZPL',
          url: data.publicUrl,
          fileName: upload.file_name,
          trackingCode: upload.tracking_code
        };

        if (!labelsByTracking[upload.tracking_code]) {
          labelsByTracking[upload.tracking_code] = [];
        }

        labelsByTracking[upload.tracking_code].push(downloadable);
      }

      return labelsByTracking;
    } catch (error) {
      console.error('Error getting downloadable labels:', error);
      throw error;
    }
  }

  /**
   * Download a single label file
   */
  async downloadLabel(filePath: string, fileName: string): Promise<void> {
    try {
      const { data } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = data.publicUrl;
      link.download = fileName;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading label:', error);
      throw error;
    }
  }

  /**
   * Download multiple labels of a specific format
   */
  async downloadLabelsByFormat(batchId: string, format: 'PDF' | 'PNG' | 'ZPL'): Promise<void> {
    try {
      const uploads = await this.getBulkLabelUploads(batchId);
      const formatUploads = uploads.filter(upload => upload.file_type === format);

      for (const upload of formatUploads) {
        await this.downloadLabel(upload.file_path, upload.file_name);
        // Add small delay to prevent browser blocking multiple downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Error downloading ${format} labels:`, error);
      throw error;
    }
  }

  /**
   * Download all labels in all formats
   */
  async downloadAllLabels(batchId: string): Promise<void> {
    try {
      const uploads = await this.getBulkLabelUploads(batchId);

      for (const upload of uploads) {
        await this.downloadLabel(upload.file_path, upload.file_name);
        // Add small delay to prevent browser blocking multiple downloads
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error('Error downloading all labels:', error);
      throw error;
    }
  }

  /**
   * Get storage bucket info
   */
  async getBucketInfo(): Promise<{ name: string; public: boolean; fileCount: number }> {
    try {
      const { data: files, error } = await supabase.storage
        .from(this.bucketName)
        .list();

      if (error) {
        throw new Error(`Error accessing bucket: ${error.message}`);
      }

      return {
        name: this.bucketName,
        public: true,
        fileCount: files?.length || 0
      };
    } catch (error) {
      console.error('Error getting bucket info:', error);
      throw error;
    }
  }
}

export const bulkStorageService = new BulkStorageService();
