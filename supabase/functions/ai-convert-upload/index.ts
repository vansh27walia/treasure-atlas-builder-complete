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
  if (ext === ".csv" || ext === ".txt") {
    return await arrayBufferToString(buffer);
  }
  if (ext === ".json" || ext === ".xml") {
    return await arrayBufferToString(buffer);
  }
  if (ext === ".docx" || ext === ".doc") {
    const jszipURL = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
    // Use a simple docx extractor: extract text from document.xml in docx ZIP
    const zip = await (await import(jszipURL)).default.loadAsync(buffer);
    const docXml = await zip.file("word/document.xml").async("string");
    // Remove tags/keep text
    return docXml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  if (ext === ".xls" || ext === ".xlsx") {
    // There are no native XLSX parsers in Deno, but we can try to use a primitive method or reject and require .csv upload
    throw new Error("Excel file support for .xls/.xlsx not available in edge runtime. Please convert to .csv or .txt before upload.");
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

Here is the uploaded file content:
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";
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
    } catch (e) {
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
      return new Response(JSON.stringify({
          error: "OpenAI response error",
          details: errText
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const aiResult = await openaiRes.json();
    const content = aiResult?.choices?.[0]?.message?.content ?? "";
    if (!content.trim() || !content.toLowerCase().startsWith(CSV_HEADERS[0].toLowerCase())) {
      return new Response(
        JSON.stringify({ error: "AI did not produce a properly formatted CSV. See logs.", ai: content }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate headers
    if (!validateCsvHeaders(content, CSV_HEADERS)) {
      return new Response(
        JSON.stringify({ error: "AI CSV output does not match required header format.", content }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
