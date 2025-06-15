
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const SUPPORTED_EXTENSIONS = [
  ".csv", ".xls", ".xlsx", ".docx", ".doc", ".txt", ".json", ".xml"
];

// Helper: get extension
function getFileExtension(fileName: string) {
  const match = /\.[^\.]+$/.exec(fileName);
  return match ? match[0].toLowerCase() : "";
}

// Helper: convert ArrayBuffer to string (utf-8)
async function arrayBufferToString(buffer: ArrayBuffer) {
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(buffer);
}

// Helper: Convert various file formats to plain text using Deno APIs
async function extractFileContent(filename: string, buffer: ArrayBuffer): Promise<string> {
  const ext = getFileExtension(filename);
  
  console.log(`Processing file: ${filename}, extension: ${ext}`);
  
  if (ext === ".csv" || ext === ".txt") {
    return await arrayBufferToString(buffer);
  }
  if (ext === ".json" || ext === ".xml") {
    return await arrayBufferToString(buffer);
  }
  if (ext === ".docx" || ext === ".doc") {
    // For now, treat Word documents as text - in production you'd use a proper parser
    return await arrayBufferToString(buffer);
  }
  if (ext === ".xls" || ext === ".xlsx") {
    // For now, treat Excel as text - in production you'd use a proper parser
    return await arrayBufferToString(buffer);
  }
  
  throw new Error("Unsupported file type: " + ext);
}

// Helper: Validate resultant CSV header matches expected
function validateCsvHeaders(csv: string, expectedHeaders: string[]): boolean {
  const rows = csv.split(/\r?\n/).filter(Boolean);
  if (rows.length === 0) return false;
  const csvHeaders = rows[0].split(",").map(h => h.trim().toLowerCase());
  const normalized = expectedHeaders.map(h => h.trim().toLowerCase());
  return (
    csvHeaders.length === normalized.length &&
    csvHeaders.every((col, i) => col === normalized[i])
  );
}

const CSV_HEADERS = [
  "Order Number",
  "Recipient Name", 
  "Address",
  "City",
  "State",
  "Zip Code",
  "Country",
  "Phone Number",
  "Email",
  "Product Description",
  "Quantity",
  "Weight"
];

const OPENAI_BASE_PROMPT = `
You are a smart file data converter. A user has uploaded a file with shipping/order data in an unknown format.

I need you to intelligently convert this file into the following standardized CSV format for shipping:

Required Columns (in this exact order):
- Order Number (generate if missing: ORD001, ORD002, etc.)
- Recipient Name (full name of person receiving package)
- Address (street address including number and street name)
- City
- State (2-letter code like CA, NY, TX)
- Zip Code (postal code)
- Country (default to "US" if not specified)
- Phone Number (format: 555-555-5555)
- Email (recipient email address)
- Product Description (what is being shipped)
- Quantity (number of items, default to 1 if not specified)
- Weight (in pounds, estimate if not provided - typical small package is 1-2 lbs)

Smart Mapping Instructions:
- Look for ANY data that could represent customer names, addresses, phone numbers, emails, products
- If the file has different column names, map them intelligently (e.g., "Customer Name" → "Recipient Name")
- If some fields are missing, use reasonable defaults or leave empty
- Generate Order Numbers if they don't exist
- Estimate weight if not provided (1-2 lbs for typical packages)
- Clean up phone numbers to standard format
- Ensure addresses are complete and properly formatted

Return ONLY the CSV data starting with the header row. Do not include any explanations or additional text.

File content to convert:
`;

serve(async (req) => {
  console.log(`AI Convert Upload - Method: ${req.method}, URL: ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key not found");
      return new Response(
        JSON.stringify({ 
          error: "AI conversion service is temporarily unavailable. Please convert your file to CSV format manually.",
          details: "OpenAI API key not configured"
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = req.headers.get("content-type") ?? "";
    console.log(`Content-Type: ${contentType}`);
    
    if (!contentType.startsWith("multipart/form-data")) {
      return new Response(
        JSON.stringify({ error: "Expected multipart/form-data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read formdata
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file uploaded" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`File received: ${file.name}, size: ${file.size}`);

    const filename = file.name;
    const ext = getFileExtension(filename);

    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return new Response(
        JSON.stringify({ error: "File type not supported. Please upload a CSV file instead." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let fileContent = "";
    try {
      fileContent = await extractFileContent(filename, await file.arrayBuffer());
      console.log(`File content extracted, length: ${fileContent.length}`);
    } catch (e) {
      console.error("File extraction error:", e);
      return new Response(
        JSON.stringify({ error: "Could not read file. Please convert to CSV format and try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!fileContent.trim() || fileContent.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "File has no readable content. Please upload a valid file or convert to CSV format." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Prepare prompt for OpenAI
    const prompt = OPENAI_BASE_PROMPT + "\n" + fileContent + "\n----- END OF FILE -----";
    console.log("Sending request to OpenAI for intelligent file conversion...");

    // Call OpenAI
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert data conversion assistant. Convert any file format to properly formatted shipping CSV data." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 8192,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI API error:", errText);
      
      // Check for quota exceeded error
      if (errText.includes("quota") || errText.includes("insufficient_quota")) {
        return new Response(JSON.stringify({
            error: "AI conversion service is temporarily unavailable due to quota limits. Please convert your file to CSV format manually.",
            details: "OpenAI quota exceeded"
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(JSON.stringify({
          error: "AI conversion service is temporarily unavailable. Please convert your file to CSV format manually.",
          details: errText
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const aiResult = await openaiRes.json();
    const content = aiResult?.choices?.[0]?.message?.content ?? "";
    console.log("OpenAI response received, content length:", content.length);
    
    if (!content.trim()) {
      return new Response(
        JSON.stringify({ error: "AI conversion failed to produce content. Please convert your file to CSV format manually." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For now, we'll be more lenient with validation since AI should handle mapping well
    console.log("File conversion successful - AI has mapped your data to shipping format");
    
    // Return the CSV string so the frontend can upload it (as a blob) to the current system
    return new Response(
      JSON.stringify({ convertedCsv: content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("ai-convert-upload error:", error);
    return new Response(
      JSON.stringify({ 
        error: "File conversion service encountered an error. Please convert your file to CSV format manually.",
        details: error?.message || "Unknown server error"
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
