export default {
  async fetch(request, env) {

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders()
      });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST requests allowed" }),
        { status: 405, headers: corsHeaders() }
      );
    }

    try {
      const body = await request.json();
      const userPrompt = body.prompt;

      if (!userPrompt) {
        return new Response(
          JSON.stringify({ error: "Prompt is required" }),
          { status: 400, headers: corsHeaders() }
        );
      }

      // Call Cloudflare AI
      const aiResponse = await env.AI.run(
        "@cf/meta/llama-3-8b-instruct",
        {
          messages: [
            {
              role: "system",
              content: "You are OmniToolaz AI Life Planner. Create structured daily plans with time blocks, priorities, productivity tips and motivation."
            },
            {
              role: "user",
              content: userPrompt
            }
          ]
        }
      );

      return new Response(
        JSON.stringify({
          success: true,
          result: aiResponse.response
        }),
        { headers: corsHeaders() }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message
        }),
        { status: 500, headers: corsHeaders() }
      );
    }
  }
};

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
