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

const GEMINI_PROMPT = `
You are an expert data converter for logistics. A user has uploaded a file with shipping data in an unknown format.
Your task is to intelligently convert this file into a standardized CSV format compatible with the EasyPost API.

The required CSV format has these exact columns in this exact order:
to_name,to_street1,to_street2,to_city,to_state,to_zip,to_country,weight,length,width,height,reference

Column-by-Column Instructions:
- to_name: Recipient's full name.
- to_street1: Primary street address line (e.g., "123 Main St").
- to_street2: Secondary address line (e.g., "Apt 4B", "Suite 200"). Leave empty if not found.
- to_city: City name.
- to_state: 2-letter state code (e.g., "CA", "NY").
- to_zip: ZIP or postal code.
- to_country: 2-letter country code. Default to "US" if not specified.
- weight: Weight in POUNDS (lbs). MUST be a number. If not provided, estimate a value (e.g., 1.5).
- length: Package length in INCHES. MUST be a number. If not provided, estimate a value (e.g., 12).
- width: Package width in INCHES. MUST be a number. If not provided, estimate a value (e.g., 8).
- height: Package height in INCHES. MUST be a number. If not provided, estimate a value (e.g., 4).
- reference: An order number or reference ID (e.g., "Order #1234"). If missing, generate a unique one like ORD-001, ORD-002, etc.

Smart Mapping Rules:
- Intelligently map fields from the source file. For example, "Customer" or "Recipient" should map to "to_name".
- Combine address components if they are separated in the source file.
- Clean up data: format phone numbers if found (though not a target column), ensure state/country codes are correct.
- If the source is just a block of text, extract the address and recipient details as best you can.
- For missing but required numeric fields (weight, length, width, height), YOU MUST provide a reasonable estimate. Do not leave them blank.

IMPORTANT: Your response must be ONLY the raw CSV data, starting with the header row. Do not include any explanations, comments, or "\`\`\`csv" markers.

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
