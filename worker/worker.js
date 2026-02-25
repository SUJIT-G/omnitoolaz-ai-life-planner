export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      // Binding check
      if (!env.AI) {
        return new Response(JSON.stringify({ error: "AI Binding missing in Settings" }), { 
          status: 500, headers: corsHeaders 
        });
      }

      const { goal, category, timeframe } = await request.json();
      
      const result = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          { role: 'system', content: 'You are an expert life planner.' },
          { role: 'user', content: `Create a ${timeframe} ${category} plan for: ${goal}` }
        ]
      });

      return new Response(JSON.stringify({ plan: result.response }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500, headers: corsHeaders
      });
    }
  }
};
