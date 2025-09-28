
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Required EasyPost template headers
const REQUIRED_HEADERS = [
  'to_name',
  'to_street1', 
  'to_city',
  'to_state',
  'to_zip',
  'to_country',
  'weight',
  'length',
  'width',
  'height'
];

const OPTIONAL_HEADERS = [
  'to_company',
  'to_street2',
  'to_phone',
  'to_email',
  'reference'
];

const ALL_TEMPLATE_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];

// Parse CSV and extract headers
const parseCSVHeaders = (csvContent: string): string[] => {
  const lines = csvContent.split('\n').filter((line: string) => line.trim() !== '');
  if (lines.length === 0) return [];
  
  const headerLine = lines[0];
  const headers: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      headers.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  headers.push(current.trim().replace(/^"|"$/g, ''));
  
  return headers.filter(h => h.length > 0);
};

// Use Gemini to suggest header mappings
const suggestHeaderMappings = async (detectedHeaders: string[]) => {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `
You are a CSV header mapping assistant. I need to map the following detected CSV headers to a standard EasyPost shipping template.

Detected headers: ${detectedHeaders.join(', ')}

Required template headers (MUST be mapped):
- to_name (recipient name)
- to_street1 (street address)
- to_city (city)
- to_state (state/province)
- to_zip (postal code)
- to_country (country code, default US)
- weight (package weight in pounds)
- length (package length in inches)
- width (package width in inches)
- height (package height in inches)

Optional template headers:
- to_company (company name)
- to_street2 (apt/suite)
- to_phone (phone number)
- to_email (email address)
- reference (order reference)

Please analyze each detected header and suggest the best mapping to template headers. Consider variations like:
- "Name" or "Customer Name" → to_name
- "Address" or "Street" → to_street1
- "State" or "Province" → to_state
- "ZIP" or "Postal Code" → to_zip
- etc.

Respond with a JSON object in this exact format:
{
  "mappings": {
    "detected_header": "template_header",
    "another_detected_header": "template_header"
  },
  "unmapped": ["header1", "header2"],
  "missing_required": ["required_header1"],
  "confidence": "high|medium|low"
}

Only map headers you're confident about. Leave uncertain ones unmapped.
`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000,
      }
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini API error body:', errText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;
  
  try {
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse Gemini response:', content);
    throw new Error('Invalid AI response format');
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvContent, action, mappings } = await req.json();
    
    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: 'CSV content is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Action: analyze - detect headers and suggest mappings
    if (action === 'analyze') {
      console.log('Analyzing CSV headers...');
      
      const detectedHeaders = parseCSVHeaders(csvContent);
      console.log('Detected headers:', detectedHeaders);
      
      if (detectedHeaders.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No headers detected in CSV' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const aiSuggestions = await suggestHeaderMappings(detectedHeaders);
      console.log('AI mapping suggestions:', aiSuggestions);

      return new Response(
        JSON.stringify({
          detectedHeaders,
          suggestions: aiSuggestions,
          requiredHeaders: REQUIRED_HEADERS,
          optionalHeaders: OPTIONAL_HEADERS
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: convert - apply mappings and convert CSV
    if (action === 'convert') {
      if (!mappings) {
        return new Response(
          JSON.stringify({ error: 'Header mappings are required for conversion' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      console.log('Converting CSV with mappings:', mappings);
      
      // Parse original CSV
      const lines = csvContent.split('\n').filter((line: string) => line.trim() !== '');
      if (lines.length < 2) {
        throw new Error('CSV must have at least one data row');
      }

      const originalHeaders = parseCSVHeaders(lines[0]);
      const headerIndexMap = Object.fromEntries(originalHeaders.map((h, i) => [h, i]));

      // Create new CSV with template headers
      const templateHeaders = ALL_TEMPLATE_HEADERS;
      const convertedRows = [templateHeaders.join(',')];

      // Process each data row
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (!row.trim()) continue;

        // Parse row data
        const rowData: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < row.length; j++) {
          const char = row[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            rowData.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        rowData.push(current.trim().replace(/^"|"$/g, ''));

        // Map to template format
        const convertedRow = templateHeaders.map(templateHeader => {
          // Find which original header maps to this template header
          const originalHeader = Object.keys(mappings).find(
            key => mappings[key] === templateHeader
          );
          
          if (originalHeader && headerIndexMap[originalHeader] !== undefined) {
            const value = rowData[headerIndexMap[originalHeader]] || '';
            // Apply default transformations
            if (templateHeader === 'to_country' && !value) {
              return 'US';
            }
            return value;
          }
          
          // Set defaults for specific fields
          if (templateHeader === 'to_country') return 'US';
          if (templateHeader === 'weight' && !rowData.some(d => d)) return '1.0';
          if (templateHeader === 'length' && !rowData.some(d => d)) return '12';
          if (templateHeader === 'width' && !rowData.some(d => d)) return '8';
          if (templateHeader === 'height' && !rowData.some(d => d)) return '4';
          
          return '';
        });

        convertedRows.push(convertedRow.map(field => `"${field}"`).join(','));
      }

      const convertedCSV = convertedRows.join('\n');
      console.log('CSV conversion completed');

      return new Response(
        JSON.stringify({
          convertedCSV,
          originalRowCount: lines.length - 1,
          convertedRowCount: convertedRows.length - 1,
          appliedMappings: mappings
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "analyze" or "convert"' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Error in ai-csv-mapper:', error);
    return new Response(
      JSON.stringify({ 
        error: 'CSV mapping failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
