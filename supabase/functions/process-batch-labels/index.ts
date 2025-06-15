
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CsvRow {
  'Tracking Number': string;
  'Drop-off Address': string;
  'Name': string;
  'Carrier': string;
  'Dimensions': string;
  'Weight': string;
  'Estimated Delivery': string;
}

const REQUIRED_HEADERS = [
  'Tracking Number',
  'Drop-off Address', 
  'Name',
  'Carrier',
  'Dimensions',
  'Weight',
  'Estimated Delivery'
];

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Encryption key for API keys (in production, use a secure key)
const ENCRYPTION_KEY = 'batch-label-processing-key-2025';

async function decryptApiKey(encryptedKey: string): Promise<string> {
  // Simple decryption - in production, use proper encryption
  try {
    const CryptoJS = await import("https://deno.land/x/crypto_js@4.1.1/index.ts");
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
    return decryptedBytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt API key');
  }
}

async function getUserApiKey(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('encrypted_key')
      .eq('user_id', userId)
      .eq('service_name', 'openai')
      .single();

    if (error || !data) {
      console.error('Error fetching API key:', error);
      return null;
    }

    return await decryptApiKey(data.encrypted_key);
  } catch (error) {
    console.error('Error retrieving API key:', error);
    return null;
  }
}

function validateCsvStructure(csvContent: string): { isValid: boolean; error?: string; rowCount?: number } {
  try {
    const lines = csvContent.trim().split('\n');
    
    if (lines.length < 2) {
      return { isValid: false, error: 'CSV must contain at least header and one data row' };
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    if (headers.length !== REQUIRED_HEADERS.length) {
      return { 
        isValid: false, 
        error: `CSV must have exactly ${REQUIRED_HEADERS.length} columns. Found ${headers.length}` 
      };
    }

    for (let i = 0; i < REQUIRED_HEADERS.length; i++) {
      if (headers[i] !== REQUIRED_HEADERS[i]) {
        return { 
          isValid: false, 
          error: `Column ${i + 1} should be "${REQUIRED_HEADERS[i]}" but found "${headers[i]}"` 
        };
      }
    }

    return { isValid: true, rowCount: lines.length - 1 };
  } catch (error) {
    return { isValid: false, error: 'Failed to parse CSV file' };
  }
}

function parseCsvToRows(csvContent: string): CsvRow[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    return row as CsvRow;
  });
}

async function generateLabelContent(row: CsvRow, openaiApiKey: string): Promise<CsvRow> {
  const prompt = `Generate enhanced label content for a shipping package with the following details:
- Tracking Number: ${row['Tracking Number']}
- Drop-off Address: ${row['Drop-off Address']}
- Recipient Name: ${row['Name']}
- Carrier: ${row['Carrier']}
- Package Dimensions: ${row['Dimensions']}
- Package Weight: ${row['Weight']}
- Estimated Delivery: ${row['Estimated Delivery']}

Please return the information in the same format, but enhance and validate the data:
1. Ensure the tracking number is properly formatted
2. Standardize and validate the address format
3. Ensure proper name formatting
4. Validate carrier name (UPS, FedEx, USPS, DHL, etc.)
5. Standardize dimensions format (LxWxH in inches)
6. Standardize weight format (X lbs or X kg)
7. Ensure delivery date is in YYYY-MM-DD format

Return only the enhanced data in the exact same CSV row format, no additional text.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a shipping label data processor. Return only the enhanced CSV row data in the exact same format as provided.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error('OpenAI API request failed');
    }

    const result = await response.json();
    const enhancedContent = result.choices?.[0]?.message?.content?.trim();

    if (!enhancedContent) {
      throw new Error('No content generated by OpenAI');
    }

    // Try to parse the enhanced content back to a row
    try {
      const values = enhancedContent.split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === REQUIRED_HEADERS.length) {
        const enhancedRow: any = {};
        REQUIRED_HEADERS.forEach((header, index) => {
          enhancedRow[header] = values[index] || row[header as keyof CsvRow];
        });
        return enhancedRow as CsvRow;
      }
    } catch (parseError) {
      console.error('Failed to parse enhanced content:', parseError);
    }

    // Fallback to original row if parsing fails
    return row;
  } catch (error) {
    console.error('Error generating label content:', error);
    // Return original row on error
    return row;
  }
}

function generateCsvFromRows(rows: CsvRow[]): string {
  const headers = REQUIRED_HEADERS.join(',');
  const dataRows = rows.map(row => 
    REQUIRED_HEADERS.map(header => `"${row[header as keyof CsvRow] || ''}"`).join(',')
  );
  
  return [headers, ...dataRows].join('\n');
}

serve(async (req) => {
  console.log(`Process batch labels - Method: ${req.method}, URL: ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Get user's OpenAI API key
    const openaiApiKey = await getUserApiKey(user.id);
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found. Please configure your API key first.');
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file uploaded');
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}`);

    // Read and validate CSV content
    const csvContent = await file.text();
    const validation = validateCsvStructure(csvContent);
    
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid CSV format');
    }

    // Create processing log
    const { data: logData, error: logError } = await supabase
      .from('batch_processing_logs')
      .insert({
        user_id: user.id,
        filename: file.name,
        original_row_count: validation.rowCount || 0,
        processed_row_count: 0,
        processing_status: 'processing'
      })
      .select()
      .single();

    if (logError) {
      throw new Error('Failed to create processing log');
    }

    console.log(`Created processing log: ${logData.id}`);

    // Parse CSV rows
    const rows = parseCsvToRows(csvContent);
    console.log(`Parsed ${rows.length} rows for processing`);

    // Process each row with OpenAI
    const processedRows: CsvRow[] = [];
    let processedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      try {
        console.log(`Processing row ${i + 1}/${rows.length}`);
        const enhancedRow = await generateLabelContent(rows[i], openaiApiKey);
        processedRows.push(enhancedRow);
        processedCount++;
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        processedRows.push(rows[i]); // Use original row on error
        failedCount++;
      }

      // Update progress
      const progress = Math.round(((i + 1) / rows.length) * 100);
      console.log(`Progress: ${progress}%`);
    }

    // Generate processed CSV
    const processedCsv = generateCsvFromRows(processedRows);
    
    // In a real implementation, you would upload this to storage and get a download URL
    // For now, we'll return the CSV content directly
    const downloadUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(processedCsv)}`;

    // Update processing log
    await supabase
      .from('batch_processing_logs')
      .update({
        processed_row_count: processedCount,
        failed_row_count: failedCount,
        processing_status: 'completed',
        download_url: downloadUrl,
        completed_at: new Date().toISOString()
      })
      .eq('id', logData.id);

    console.log(`Processing completed: ${processedCount} successful, ${failedCount} failed`);

    // Get updated log data
    const { data: updatedLog } = await supabase
      .from('batch_processing_logs')
      .select('*')
      .eq('id', logData.id)
      .single();

    return new Response(
      JSON.stringify({
        processingLog: updatedLog,
        downloadUrl,
        processedCsv // Include CSV content for direct download
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Process batch labels error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Processing failed',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
