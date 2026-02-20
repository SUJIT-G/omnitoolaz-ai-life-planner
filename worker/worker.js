export default {
  async fetch(request, env, ctx) {
    // 1. Handle CORS Preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // 2. Only allow POST requests for the actual logic
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      // Parse the JSON body from the frontend
      const { goal, category, timeframe } = await request.json();

      if (!goal || !category || !timeframe) {
        return new Response(JSON.stringify({ error: 'Missing parameters' }), { 
            status: 400,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Construct the AI Prompt
      const systemPrompt = `You are a world-class life coach and productivity expert. 
Provide a clear, highly actionable step-by-step plan for the user. 
Format using clean Markdown. Keep it inspiring but highly practical.`;
      
      const userPrompt = `Create a ${timeframe} plan for the category "${category}" to achieve this goal: "${goal}". 
Include milestones, daily habits, and a brief mindset advice section.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      // Call Cloudflare Workers AI (Using Llama 3 Model)
      const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: messages
      });

      // Return the generated response as JSON
      return new Response(JSON.stringify({ plan: aiResponse.response }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*' 
          }
      });
    }
  },
};
