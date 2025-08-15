
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a simple SVG preview based on the format
const generatePreviewSVG = (format: string): string => {
  const previews = {
    '4x6': `
      <svg width="300" height="450" viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="450" fill="white" stroke="#ccc" stroke-width="2"/>
        <rect x="10" y="10" width="280" height="60" fill="#f0f0f0" stroke="#999"/>
        <text x="150" y="45" text-anchor="middle" font-family="Arial" font-size="14" fill="#333">4x6" Shipping Label</text>
        <rect x="10" y="80" width="280" height="100" fill="#e8f4f8" stroke="#999"/>
        <text x="150" y="135" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">Label Content Area</text>
        <rect x="10" y="190" width="280" height="250" fill="#f8f8f8" stroke="#999"/>
        <text x="150" y="320" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">Address & Barcode</text>
      </svg>
    `,
    '8.5x11-left': `
      <svg width="400" height="518" viewBox="0 0 400 518" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="518" fill="white" stroke="#ccc" stroke-width="2"/>
        <rect x="10" y="10" width="180" height="270" fill="#e8f4f8" stroke="#999" stroke-width="2"/>
        <text x="100" y="150" text-anchor="middle" font-family="Arial" font-size="12" fill="#333">4x6" Label</text>
        <text x="100" y="170" text-anchor="middle" font-family="Arial" font-size="10" fill="#666">Top-Left Position</text>
        <text x="200" y="400" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">8.5" x 11" Page</text>
      </svg>
    `,
    '8.5x11-top': `
      <svg width="400" height="518" viewBox="0 0 400 518" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="518" fill="white" stroke="#ccc" stroke-width="2"/>
        <rect x="110" y="20" width="180" height="270" fill="#e8f4f8" stroke="#999" stroke-width="2"/>
        <text x="200" y="160" text-anchor="middle" font-family="Arial" font-size="12" fill="#333">4x6" Label</text>
        <text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="10" fill="#666">Top-Center Position</text>
        <text x="200" y="450" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">8.5" x 11" Page</text>
      </svg>
    `,
    '8.5x11-two': `
      <svg width="400" height="518" viewBox="0 0 400 518" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="518" fill="white" stroke="#ccc" stroke-width="2"/>
        <rect x="110" y="20" width="180" height="120" fill="#e8f4f8" stroke="#999" stroke-width="2"/>
        <text x="200" y="85" text-anchor="middle" font-family="Arial" font-size="10" fill="#333">4x6" Label 1</text>
        <rect x="110" y="160" width="180" height="120" fill="#e8f4f8" stroke="#999" stroke-width="2"/>
        <text x="200" y="225" text-anchor="middle" font-family="Arial" font-size="10" fill="#333">4x6" Label 2</text>
        <text x="200" y="450" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">8.5" x 11" Page</text>
      </svg>
    `
  };

  return previews[format as keyof typeof previews] || previews['4x6'];
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request parameters
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || '4x6';

    console.log(`Generating preview for format: ${format}`);

    // Generate SVG preview
    const svgContent = generatePreviewSVG(format);

    // Return the SVG as an image
    return new Response(svgContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600'
      },
    });

  } catch (error) {
    console.error('Error in generate-label-preview function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
