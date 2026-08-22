import { supabase } from "../../lib/supabase";

// OpenAI is called server-side through the Supabase Edge Function.
// Never expose the OpenAI API key in the browser.
export async function generate(prompt, car) {
  const { data, error } = await supabase.functions.invoke("generate-ai", {
    body: {
      prompt,
      model: "gpt-5.5",
      temperature: 0.8,
      maxTokens: 3000,
      carId: car?.id || null,
    },
  });

  if (error) {
    throw new Error(error.message || "Không thể gọi Toyota AI.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data?.output_text || "";
}
