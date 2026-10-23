import { allowSubmission, corsHeaders, isEmail, jsonResponse, serviceClient } from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await request.json();
    if (body?.company) return jsonResponse({ ok: true });
    if (!isEmail(body?.email)) return jsonResponse({ error: "সঠিক ইমেইল দিন / Enter a valid email" }, 400);

    const client = serviceClient();
    if (!(await allowSubmission(client, "subscribers", request))) {
      return jsonResponse({ error: "অনেকবার চেষ্টা করা হয়েছে / Too many submissions; try again later" }, 429);
    }
    const { error } = await client.from("subscribers").upsert(
      { email: body.email.trim().toLowerCase() },
      { onConflict: "email", ignoreDuplicates: true },
    );
    if (error) throw error;
    return jsonResponse({ ok: true }, 201);
  } catch (error) {
    console.error("Newsletter subscription failed", error instanceof Error ? error.message : "unknown error");
    return jsonResponse({ error: "সাবস্ক্রাইব করা যায়নি / Could not subscribe" }, 500);
  }
});
