import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
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

// Rule-based fallback mapping function
const generateRuleBasedMappings = (detectedHeaders: string[]) => {
  const mappings: { [key: string]: string } = {};
  const unmapped: string[] = [];
  
  // Mapping rules - case insensitive matching
  const rules = [
    // Name mappings
    { patterns: ['name', 'recipient', 'customer_name', 'full_name', 'contact_name'], target: 'to_name' },
    { patterns: ['company', 'business', 'organization', 'company_name'], target: 'to_company' },
    
    // Address mappings
    { patterns: ['address', 'street', 'address1', 'street1', 'street_address', 'line1'], target: 'to_street1' },
    { patterns: ['address2', 'street2', 'apt', 'suite', 'unit', 'line2'], target: 'to_street2' },
    { patterns: ['city', 'town'], target: 'to_city' },
    { patterns: ['state', 'province', 'region'], target: 'to_state' },
    { patterns: ['zip', 'postal', 'postcode', 'postal_code', 'zipcode'], target: 'to_zip' },
    { patterns: ['country', 'country_code'], target: 'to_country' },
    
    // Contact mappings
    { patterns: ['phone', 'telephone', 'mobile', 'contact_number'], target: 'to_phone' },
    { patterns: ['email', 'email_address', 'contact_email'], target: 'to_email' },
    
    // Package mappings
    { patterns: ['weight', 'wt', 'weight_lbs', 'weight_pounds'], target: 'weight' },
    { patterns: ['length', 'len', 'l'], target: 'length' },
    { patterns: ['width', 'w', 'wide'], target: 'width' },
    { patterns: ['height', 'h', 'tall'], target: 'height' },
    
    // Reference
    { patterns: ['reference', 'ref', 'order_id', 'order_number', 'tracking'], target: 'reference' }
  ];

  detectedHeaders.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim();
    let mapped = false;

    for (const rule of rules) {
      if (rule.patterns.some(pattern => normalizedHeader.includes(pattern))) {
        // Avoid duplicate mappings
        if (!Object.values(mappings).includes(rule.target)) {
          mappings[header] = rule.target;
          mapped = true;
          break;
        }
      }
    }

    if (!mapped) {
      unmapped.push(header);
    }
  });

  // Determine missing required fields
  const mappedTemplateHeaders = Object.values(mappings);
  const missingRequired = REQUIRED_HEADERS.filter(req => !mappedTemplateHeaders.includes(req));

  return {
    mappings,
    unmapped,
    missing_required: missingRequired,
    confidence: Object.keys(mappings).length > 5 ? 'high' : 'medium'
  };
};

// Use Gemini to suggest header mappings with fallback
const suggestHeaderMappings = async (detectedHeaders: string[]) => {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  
  // Try AI suggestions first, fall back to rule-based mapping if it fails
  if (geminiApiKey) {
    try {
      console.log('Attempting AI header mapping...');
      
      const prompt = `You are a CSV header mapping assistant. Map these CSV headers to EasyPost shipping template headers.

Detected headers: ${detectedHeaders.join(', ')}

Required template headers:
- to_name (recipient name)
- to_street1 (street address) 
- to_city (city)
- to_state (state/province)
- to_zip (postal code)
- to_country (country code, default US)
- weight (package weight in pounds)
- length, width, height (package dimensions in inches)

Optional: to_company, to_street2, to_phone, to_email, reference

Respond with valid JSON only:
{
  "mappings": {"detected_header": "template_header"},
  "unmapped": ["header1"],
  "missing_required": ["required_header1"],
  "confidence": "high|medium|low"
}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
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
            maxOutputTokens: 800,
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (content) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            console.log('AI mapping successful:', result);
            return result;
          }
        }
      } else {
        console.log('Gemini API failed with status:', response.status);
        const errorBody = await response.text();
        console.log('Gemini error details:', errorBody);
      }
    } catch (error) {
      console.log('AI mapping failed, using fallback:', error);
    }
  }

  // Fallback: Rule-based header mapping
  console.log('Using rule-based header mapping...');
  return generateRuleBasedMappings(detectedHeaders);
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

      const suggestions = await suggestHeaderMappings(detectedHeaders);
      console.log('Header mapping suggestions:', suggestions);

      return new Response(
        JSON.stringify({
          detectedHeaders,
          suggestions,
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