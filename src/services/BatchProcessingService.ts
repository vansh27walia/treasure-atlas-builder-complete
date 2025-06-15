
import { supabase } from '@/integrations/supabase/client';

export interface ProcessingLog {
  id: string;
  filename: string;
  original_row_count: number;
  processed_row_count: number;
  failed_row_count: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  download_url?: string;
  created_at: string;
  completed_at?: string;
}

export class BatchProcessingService {
  static async createProcessingLog(
    filename: string,
    originalRowCount: number
  ): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('batch_processing_logs')
        .insert({
          user_id: user.id,
          filename,
          original_row_count: originalRowCount,
          processed_row_count: 0,
          processing_status: 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating processing log:', error);
      return null;
    }
  }

  static async updateProcessingLog(
    logId: string,
    updates: Partial<ProcessingLog>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('batch_processing_logs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', logId);

      return !error;
    } catch (error) {
      console.error('Error updating processing log:', error);
      return false;
    }
  }

  static async getProcessingLogs(): Promise<ProcessingLog[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('batch_processing_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion to ensure processing_status matches our union type
      return (data || []).map(log => ({
        ...log,
        processing_status: log.processing_status as 'pending' | 'processing' | 'completed' | 'failed'
      }));
    } catch (error) {
      console.error('Error fetching processing logs:', error);
      return [];
    }
  }
}
