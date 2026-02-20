export default {
  async fetch(request, env) {

    if (request.method === "OPTIONS") {
      return new Response("", {
        headers: corsHeaders()
      });
    }

    try {
      const { prompt } = await request.json();

      const aiResponse = await env.AI.run(
        "@cf/meta/llama-3-8b-instruct",
        {
          messages: [
            {
              role: "system",
              content:
                "You are OmniToolz AI Life Planner. Create detailed daily productivity plans with tasks, time blocks, and motivation tips."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        }
      );

      return new Response(
        JSON.stringify(aiResponse),
        { headers: corsHeaders() }
      );

    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { headers: corsHeaders(), status: 500 }
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
