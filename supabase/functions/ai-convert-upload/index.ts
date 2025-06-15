
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
You are a file data converter. A user has uploaded a file in an unknown format and structure.

I need you to convert this file into the following CSV format:

Columns:
- Order Number
- Recipient Name
- Address
- City
- State
- Zip Code
- Country
- Phone Number
- Email
- Product Description
- Quantity
- Weight

Instructions:
- Map any fields in the uploaded file to these columns as best as possible based on context and content.
- If a field does not exist in the uploaded file, leave it empty.
- Do not modify the headers or add new columns.
- Return the data in CSV format as a string.
- Start with the header row containing exactly these column names.

Here is the uploaded file content:
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
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        JSON.stringify({ error: "File type not supported." }),
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
        JSON.stringify({ error: "Could not read file: " + e.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!fileContent.trim() || fileContent.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "File has no readable or useful content." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Prepare prompt for OpenAI
    const prompt = OPENAI_BASE_PROMPT + "\n" + fileContent + "\n----- END OF FILE -----";
    console.log("Sending request to OpenAI...");

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
          { role: "system", content: "You are a helpful assistant for file data conversion." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 8192,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI API error:", errText);
      return new Response(JSON.stringify({
          error: "OpenAI response error",
          details: errText
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const aiResult = await openaiRes.json();
    const content = aiResult?.choices?.[0]?.message?.content ?? "";
    console.log("OpenAI response received, content length:", content.length);
    
    if (!content.trim()) {
      return new Response(
        JSON.stringify({ error: "AI did not produce any content." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate headers
    if (!validateCsvHeaders(content, CSV_HEADERS)) {
      console.warn("CSV validation failed, content:", content.substring(0, 200));
      return new Response(
        JSON.stringify({ error: "AI CSV output does not match required header format.", content: content.substring(0, 500) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("File conversion successful");
    
    // Return the CSV string so the frontend can upload it (as a blob) to the current system
    return new Response(
      JSON.stringify({ convertedCsv: content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("ai-convert-upload error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown server error", details: error }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
