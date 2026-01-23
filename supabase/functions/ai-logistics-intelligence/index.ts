import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShipmentData {
  id: string;
  tracking_code: string;
  carrier: string;
  service: string;
  status: string;
  from_address: any;
  to_address: any;
  created_at: string;
  est_delivery_date?: string;
  tracking_details?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, shipmentId, trackingCode, timeRange } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch user's shipment data
    const { data: shipments, error: shipmentError } = await supabase
      .from('shipment_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (shipmentError) {
      console.error('Error fetching shipments:', shipmentError);
    }

    const shipmentData = shipments || [];

    switch (action) {
      case 'analyze_shipment':
        return await analyzeShipment(supabase, user.id, shipmentId, trackingCode, shipmentData, LOVABLE_API_KEY);
      
      case 'predict_delays':
        return await predictDelays(supabase, user.id, shipmentData, LOVABLE_API_KEY);
      
      case 'analyze_carriers':
        return await analyzeCarriers(supabase, user.id, shipmentData, LOVABLE_API_KEY);
      
      case 'generate_customer_message':
        return await generateCustomerMessage(supabase, user.id, shipmentId, trackingCode, shipmentData, LOVABLE_API_KEY);
      
      case 'get_overview':
        return await getAIOverview(supabase, user.id, shipmentData, LOVABLE_API_KEY);
      
      case 'get_alerts':
        return await getAlerts(supabase, user.id);
      
      case 'resolve_alert':
        return await resolveAlert(supabase, user.id, shipmentId);
      
      case 'optimize_routes':
        return await optimizeRoutes(supabase, user.id, shipmentData, LOVABLE_API_KEY);
      
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('AI Logistics Intelligence error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function callAI(prompt: string, apiKey: string): Promise<any> {
  const startTime = Date.now();
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert logistics intelligence AI. You analyze shipping data to provide actionable insights, predict delays, assess risks, and optimize operations. Always respond with valid JSON matching the requested schema. Be specific, data-driven, and provide confidence scores (0.00 to 1.00) for predictions.`
        },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error(`AI service error: ${response.status}`);
  }

  const data = await response.json();
  const processingTime = Date.now() - startTime;
  
  const content = data.choices?.[0]?.message?.content || '';
  
  // Parse JSON from response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return { result: JSON.parse(jsonMatch[0]), processingTime };
    }
  } catch (e) {
    console.error('JSON parse error:', e);
  }
  
  return { result: { raw: content }, processingTime };
}

async function analyzeShipment(supabase: any, userId: string, shipmentId: string, trackingCode: string, shipments: any[], apiKey: string) {
  const shipment = shipments.find(s => s.shipment_id === shipmentId || s.tracking_code === trackingCode);
  
  if (!shipment) {
    return new Response(JSON.stringify({ error: 'Shipment not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const prompt = `Analyze this shipment and provide intelligence insights:

Shipment Data:
- Tracking Code: ${shipment.tracking_code}
- Carrier: ${shipment.carrier}
- Service: ${shipment.service}
- Status: ${shipment.status}
- Created: ${shipment.created_at}
- Estimated Delivery: ${shipment.est_delivery_date || 'Unknown'}
- From: ${JSON.stringify(shipment.from_address_json)}
- To: ${JSON.stringify(shipment.to_address_json)}
- Tracking Events: ${JSON.stringify(shipment.tracking_details || [])}

Respond with JSON:
{
  "summary": "Brief human-readable summary of shipment status",
  "currentInterpretation": "What is actually happening with this shipment right now",
  "riskLevel": "low|medium|high|critical",
  "confidenceScore": 0.85,
  "delayProbability": 0.15,
  "delayReason": "Reason if delay likely, null otherwise",
  "predictedDeliveryDate": "ISO date string",
  "recommendations": ["Action 1", "Action 2"],
  "anomalies": ["Any unusual patterns detected"]
}`;

  const { result, processingTime } = await callAI(prompt, apiKey);

  // Store insight in database
  const { error: insertError } = await supabase.from('ai_shipment_insights').upsert({
    user_id: userId,
    shipment_id: shipment.shipment_id || shipmentId,
    tracking_code: shipment.tracking_code,
    ai_summary: result.summary || 'Analysis completed',
    confidence_score: result.confidenceScore || 0.5,
    risk_level: result.riskLevel || 'low',
    predicted_delivery_date: result.predictedDeliveryDate,
    delay_probability: result.delayProbability || 0,
    delay_reason: result.delayReason,
    current_interpretation: result.currentInterpretation,
    recommendations: result.recommendations || [],
    raw_analysis: result,
    updated_at: new Date().toISOString()
  }, { onConflict: 'shipment_id' });

  if (insertError) console.error('Error storing insight:', insertError);

  // Log AI decision
  await supabase.from('ai_decision_logs').insert({
    user_id: userId,
    decision_type: 'shipment_analysis',
    input_data: { shipment },
    output_data: result,
    processing_time_ms: processingTime,
    confidence_score: result.confidenceScore
  });

  return new Response(JSON.stringify({ success: true, analysis: result }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function predictDelays(supabase: any, userId: string, shipments: any[], apiKey: string) {
  const activeShipments = shipments.filter(s => 
    s.status && !['delivered', 'cancelled', 'returned'].includes(s.status.toLowerCase())
  );

  if (activeShipments.length === 0) {
    return new Response(JSON.stringify({ predictions: [], message: 'No active shipments to analyze' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const prompt = `Analyze these active shipments and predict which ones are likely to be delayed:

Shipments:
${activeShipments.slice(0, 20).map(s => `
- ID: ${s.shipment_id}
- Tracking: ${s.tracking_code}
- Carrier: ${s.carrier}
- Service: ${s.service}
- Status: ${s.status}
- Created: ${s.created_at}
- Est Delivery: ${s.est_delivery_date || 'Unknown'}
- Days Since Created: ${Math.floor((Date.now() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24))}
`).join('\n')}

For each shipment at risk of delay, respond with JSON:
{
  "predictions": [
    {
      "shipmentId": "ID",
      "trackingCode": "code",
      "delayProbability": 0.75,
      "predictedDelayHours": 24,
      "delayType": "customs|carrier_backlog|weather|missed_scan|handoff_failure|lost_package|other",
      "rootCause": "Explanation of likely cause",
      "confidenceScore": 0.8,
      "reasoning": "Why we predict this",
      "suggestedActions": ["Action 1", "Action 2"]
    }
  ],
  "overallRiskSummary": "Brief summary of overall delay risk across all shipments"
}`;

  const { result, processingTime } = await callAI(prompt, apiKey);
  const predictions = result.predictions || [];

  // Store predictions
  for (const pred of predictions) {
    if (pred.delayProbability > 0.3) {
      await supabase.from('ai_delay_predictions').insert({
        user_id: userId,
        shipment_id: pred.shipmentId,
        tracking_code: pred.trackingCode,
        delay_probability: pred.delayProbability,
        predicted_delay_hours: pred.predictedDelayHours || 0,
        delay_type: pred.delayType,
        root_cause: pred.rootCause,
        confidence_score: pred.confidenceScore,
        reasoning: pred.reasoning,
        suggested_actions: pred.suggestedActions || []
      });

      // Create alert for high-risk shipments
      if (pred.delayProbability > 0.6) {
        await supabase.from('ai_alerts').insert({
          user_id: userId,
          alert_type: 'high_delay_risk',
          severity: pred.delayProbability > 0.8 ? 'critical' : 'high',
          title: `High delay risk: ${pred.trackingCode}`,
          description: pred.reasoning,
          shipment_id: pred.shipmentId,
          tracking_code: pred.trackingCode,
          suggested_action: pred.suggestedActions?.[0]
        });
      }
    }
  }

  return new Response(JSON.stringify({ 
    success: true, 
    predictions,
    summary: result.overallRiskSummary 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function analyzeCarriers(supabase: any, userId: string, shipments: any[], apiKey: string) {
  const carrierStats: Record<string, any[]> = {};
  
  for (const shipment of shipments) {
    if (!shipment.carrier) continue;
    if (!carrierStats[shipment.carrier]) {
      carrierStats[shipment.carrier] = [];
    }
    carrierStats[shipment.carrier].push(shipment);
  }

  const carrierSummary = Object.entries(carrierStats).map(([carrier, shipments]) => {
    const delivered = shipments.filter(s => s.status?.toLowerCase() === 'delivered');
    const delayed = shipments.filter(s => {
      if (!s.est_delivery_date) return false;
      const estDate = new Date(s.est_delivery_date);
      const now = new Date();
      return now > estDate && s.status?.toLowerCase() !== 'delivered';
    });
    
    return {
      carrier,
      totalShipments: shipments.length,
      delivered: delivered.length,
      delayed: delayed.length,
      avgCost: shipments.reduce((sum, s) => sum + (s.charged_rate || 0), 0) / shipments.length
    };
  });

  const prompt = `Analyze carrier performance data and provide intelligence:

Carrier Statistics:
${JSON.stringify(carrierSummary, null, 2)}

Provide a comprehensive carrier performance analysis in JSON:
{
  "carriers": [
    {
      "carrier": "carrier name",
      "reliabilityScore": 0.85,
      "speedScore": 0.75,
      "costEfficiencyScore": 0.9,
      "overallScore": 0.83,
      "onTimePercentage": 92.5,
      "averageDelayHours": 4.2,
      "performanceTrend": "improving|stable|declining",
      "recommendation": "Use for X shipments, avoid for Y",
      "bestFor": ["Express shipments", "Local delivery"],
      "weaknesses": ["International", "Heavy packages"]
    }
  ],
  "overallRecommendation": "Summary of which carriers to prefer and why"
}`;

  const { result, processingTime } = await callAI(prompt, apiKey);
  const carriers = result.carriers || [];

  // Store carrier scores
  for (const c of carriers) {
    await supabase.from('ai_carrier_scores').upsert({
      user_id: userId,
      carrier: c.carrier,
      reliability_score: c.reliabilityScore,
      speed_score: c.speedScore,
      cost_efficiency_score: c.costEfficiencyScore,
      overall_score: c.overallScore,
      total_shipments_analyzed: carrierStats[c.carrier]?.length || 0,
      on_time_percentage: c.onTimePercentage,
      average_delay_hours: c.averageDelayHours,
      ai_recommendation: c.recommendation,
      performance_trend: c.performanceTrend,
      best_lanes: c.bestFor || [],
      worst_lanes: c.weaknesses || [],
      analysis_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      analysis_period_end: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'carrier' });
  }

  return new Response(JSON.stringify({ 
    success: true, 
    carriers,
    overallRecommendation: result.overallRecommendation 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function generateCustomerMessage(supabase: any, userId: string, shipmentId: string, trackingCode: string, shipments: any[], apiKey: string) {
  const shipment = shipments.find(s => s.shipment_id === shipmentId || s.tracking_code === trackingCode);
  
  if (!shipment) {
    return new Response(JSON.stringify({ error: 'Shipment not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const prompt = `Generate a customer-ready message about this shipment status:

Shipment:
- Tracking: ${shipment.tracking_code}
- Carrier: ${shipment.carrier}
- Status: ${shipment.status}
- Created: ${shipment.created_at}
- Estimated Delivery: ${shipment.est_delivery_date || 'Unknown'}
- Tracking Events: ${JSON.stringify(shipment.tracking_details || [])}

Generate a friendly, professional customer message in JSON:
{
  "customerReadyMessage": "The actual message to send to customer",
  "messageType": "status_update|delay_notification|delivery_confirmation|issue_resolution|proactive_update",
  "sentiment": "positive|neutral|concerned|urgent",
  "internalNotes": "Notes for support team",
  "escalationNeeded": false,
  "escalationReason": null
}`;

  const { result, processingTime } = await callAI(prompt, apiKey);

  // Store message
  await supabase.from('ai_customer_messages').insert({
    user_id: userId,
    shipment_id: shipment.shipment_id || shipmentId,
    tracking_code: shipment.tracking_code,
    message_type: result.messageType || 'status_update',
    customer_ready_message: result.customerReadyMessage,
    internal_notes: result.internalNotes,
    sentiment: result.sentiment,
    escalation_needed: result.escalationNeeded || false,
    escalation_reason: result.escalationReason
  });

  return new Response(JSON.stringify({ success: true, message: result }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getAIOverview(supabase: any, userId: string, shipments: any[], apiKey: string) {
  // Get existing insights and alerts
  const [
    { data: insights },
    { data: alerts },
    { data: predictions },
    { data: carrierScores }
  ] = await Promise.all([
    supabase.from('ai_shipment_insights').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(10),
    supabase.from('ai_alerts').select('*').eq('user_id', userId).eq('is_resolved', false).order('created_at', { ascending: false }).limit(20),
    supabase.from('ai_delay_predictions').select('*').eq('user_id', userId).gte('expires_at', new Date().toISOString()).order('delay_probability', { ascending: false }).limit(10),
    supabase.from('ai_carrier_scores').select('*').eq('user_id', userId)
  ]);

  const activeShipments = shipments.filter(s => 
    s.status && !['delivered', 'cancelled', 'returned'].includes(s.status.toLowerCase())
  );

  const prompt = `Generate an executive overview of logistics operations:

Active Shipments: ${activeShipments.length}
Total Shipments (30 days): ${shipments.length}
Unresolved Alerts: ${(alerts || []).length}
High-Risk Shipments: ${(predictions || []).filter((p: any) => p.delay_probability > 0.6).length}

Recent Insights: ${JSON.stringify((insights || []).slice(0, 5))}
Carrier Performance: ${JSON.stringify(carrierScores || [])}

Generate an executive summary in JSON:
{
  "headline": "One-line status summary",
  "riskSummary": "Overall risk assessment",
  "topPriorities": [
    { "priority": 1, "issue": "Description", "action": "Suggested action" }
  ],
  "metrics": {
    "healthScore": 85,
    "atRiskShipments": 3,
    "predictedDelays24h": 2,
    "carrierIssues": 1
  },
  "recommendations": ["Strategic recommendation 1", "Strategic recommendation 2"],
  "insights": ["Key insight 1", "Key insight 2"]
}`;

  const { result, processingTime } = await callAI(prompt, apiKey);

  return new Response(JSON.stringify({ 
    success: true, 
    overview: result,
    stats: {
      activeShipments: activeShipments.length,
      totalShipments: shipments.length,
      unresolvedAlerts: (alerts || []).length,
      recentInsights: (insights || []).length
    },
    alerts: alerts || [],
    predictions: predictions || [],
    carrierScores: carrierScores || []
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getAlerts(supabase: any, userId: string) {
  const { data: alerts, error } = await supabase
    .from('ai_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ alerts: alerts || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function resolveAlert(supabase: any, userId: string, alertId: string) {
  const { error } = await supabase
    .from('ai_alerts')
    .update({ is_resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', alertId)
    .eq('user_id', userId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function optimizeRoutes(supabase: any, userId: string, shipments: any[], apiKey: string) {
  const routeData = shipments.reduce((acc: any, s) => {
    const from = s.from_address_json?.state || 'Unknown';
    const to = s.to_address_json?.state || 'Unknown';
    const key = `${from} -> ${to}`;
    if (!acc[key]) {
      acc[key] = { count: 0, avgCost: 0, totalCost: 0, carriers: {} };
    }
    acc[key].count++;
    acc[key].totalCost += s.charged_rate || 0;
    acc[key].avgCost = acc[key].totalCost / acc[key].count;
    if (s.carrier) {
      acc[key].carriers[s.carrier] = (acc[key].carriers[s.carrier] || 0) + 1;
    }
    return acc;
  }, {});

  const prompt = `Analyze shipping routes and costs for optimization:

Route Data:
${JSON.stringify(routeData, null, 2)}

Provide route optimization recommendations in JSON:
{
  "routes": [
    {
      "route": "State A -> State B",
      "currentAvgCost": 25.50,
      "optimizedCost": 22.00,
      "savingPercentage": 13.7,
      "recommendation": "Switch to carrier X for this lane",
      "preferredCarrier": "UPS",
      "alternativeCarriers": ["FedEx"],
      "volumeOpportunity": "High volume lane - negotiate rates"
    }
  ],
  "totalPotentialSavings": 1250.00,
  "topRecommendation": "Focus on X to achieve Y savings"
}`;

  const { result, processingTime } = await callAI(prompt, apiKey);

  return new Response(JSON.stringify({ 
    success: true, 
    optimization: result,
    routeData 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
