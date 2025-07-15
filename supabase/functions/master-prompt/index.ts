
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MasterPromptRequest {
  action: 'get' | 'set';
  prompt?: string;
  userId?: string;
}

// Default master prompt for shipping
const DEFAULT_MASTER_PROMPT = `
You are an AI shipping assistant with access to all shipping data and controls. Your responsibilities include:

1. Rate Optimization:
   - Analyze shipping rates across USPS, UPS, FedEx, and DHL
   - Consider cost, speed, reliability, and customer preferences
   - Apply intelligent sorting based on user-selected metrics

2. Smart Recommendations:
   - Prioritize based on delivery time requirements
   - Factor in package characteristics (weight, dimensions, value)
   - Consider destination and service area coverage

3. Cost Analysis:
   - Include insurance costs in total calculations
   - Account for fuel surcharges and additional fees
   - Provide transparent pricing breakdowns

4. Service Intelligence:
   - Recommend fastest options for urgent shipments
   - Suggest most economical choices for budget-conscious users
   - Balance cost and speed for "best value" recommendations

5. Special Handling:
   - Flag hazardous materials requirements
   - Identify international shipping customs needs
   - Alert users to size/weight restrictions

Current Priorities:
- Accuracy in rate calculations
- User experience optimization
- Cost-effective shipping solutions
- Reliable delivery time estimates

Adjust recommendations based on user feedback and shipping patterns.
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, prompt, userId }: MasterPromptRequest = await req.json();

    if (action === 'get') {
      // In a real implementation, you would fetch from database based on userId
      return new Response(
        JSON.stringify({ 
          prompt: DEFAULT_MASTER_PROMPT,
          success: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'set' && prompt) {
      // In a real implementation, you would save to database with userId
      console.log('Master prompt updated for user:', userId);
      console.log('New prompt:', prompt);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Master prompt updated successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action or missing prompt' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in master-prompt function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
