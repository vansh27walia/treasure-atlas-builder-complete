import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const SUPPORTED_EXTENSIONS = [
  ".csv", ".xls", ".xlsx", ".docx", ".doc", ".txt", ".json", ".xml"
];

function getFileExtension(fileName: string) {
  const match = /\.[^\.]+$/.exec(fileName);
  return match ? match[0].toLowerCase() : "";
}

async function arrayBufferToString(buffer: ArrayBuffer) {
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(buffer);
}

async function extractFileContent(filename: string, buffer: ArrayBuffer): Promise<string> {
  const ext = getFileExtension(filename);

  if (ext === ".csv" || ext === ".txt") {
    return await arrayBufferToString(buffer);
  }
  if (ext === ".json" || ext === ".xml") {
    return await arrayBufferToString(buffer);
  }
  if (ext === ".docx" || ext === ".doc") {
    return await arrayBufferToString(buffer);
  }
  if (ext === ".xls" || ext === ".xlsx") {
    return await arrayBufferToString(buffer);
  }

  throw new Error("Unsupported file type: " + ext);
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

const GEMINI_PROMPT = `
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: "Gemini conversion service is temporarily unavailable. Please provide your Gemini API key in Supabase function secrets.",
          details: "GEMINI_API_KEY missing"
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.startsWith("multipart/form-data")) {
      return new Response(
        JSON.stringify({ error: "Expected multipart/form-data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file uploaded" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const filename = file.name;
    const ext = getFileExtension(filename);

    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return new Response(
        JSON.stringify({ error: "File type not supported. Please upload a CSV, Excel, TXT, DOC, DOCX, JSON, or XML file." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let fileContent = "";
    try {
      fileContent = await extractFileContent(filename, await file.arrayBuffer());
    } catch (e) {
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

    // Use Gemini to convert
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const userPrompt = GEMINI_PROMPT + "\n" + fileContent + "\n----- END OF FILE -----";

    // Gemini expects { contents: [{ parts: [{ text: ... }] }] }
    const geminiBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: userPrompt }
          ]
        }
      ]
    };

    const aiRes = await fetch(geminiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geminiBody)
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      console.error("Gemini API Error:", errorText);
      if (errorText.includes("API key not valid") || errorText.includes("API_KEY_INVALID")) {
        return new Response(JSON.stringify({
          error: "Your Gemini API key is invalid or not configured correctly.",
          details: "Please check your Gemini API key in the Supabase secrets. Ensure it has the correct permissions and is not expired."
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (errorText.includes("quota")) {
        return new Response(JSON.stringify({
          error: "Gemini conversion service quota exceeded. Please check your Gemini billing/usage.",
          details: errorText
        }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({
        error: "Gemini AI conversion failed.",
        details: `The AI service returned an error. Please check your API key or usage. Details: ${errorText}`
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const geminiResult = await aiRes.json();

    // The Gemini API structure: .candidates[0].content.parts[0].text
    const content = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!content.trim()) {
      return new Response(
        JSON.stringify({ error: "Gemini conversion failed to produce content. Please try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return as convertedCsv (same as original OpenAI flow)
    return new Response(
      JSON.stringify({ convertedCsv: content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: "File conversion service encountered an error. Please try again.",
        details: error?.message || "Unknown server error"
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
