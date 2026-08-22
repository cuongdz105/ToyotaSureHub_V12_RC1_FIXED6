import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return json({ error: "OPENAI_API_KEY chưa được cấu hình trên Supabase Edge Function." }, 500);
  }

  try {
    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) return json({ error: "Prompt không được để trống." }, 400);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body?.model || "gpt-5.5",
        input: prompt,
        max_output_tokens: body?.maxTokens ?? 3000,
      }),
    });

    const raw = await response.text();
    let data: any;
    try { data = JSON.parse(raw); } catch { data = { error: raw }; }

    if (!response.ok) {
      return json({ error: data?.error?.message || data?.error || "OpenAI request failed." }, response.status);
    }

    const outputText = data?.output_text ||
      data?.output?.flatMap((item: any) => item?.content || [])
        ?.filter((item: any) => item?.type === "output_text")
        ?.map((item: any) => item?.text || "")
        ?.join("") || "";

    return json({ output_text: outputText });
  } catch (error) {
    console.error("generate-ai error", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
