import { corsHeaders, jsonResponse } from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST" && request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const siteUrl = Deno.env.get("SITE_URL");
    if (!siteUrl) throw new Error("SITE_URL is not configured");
    const destination = new URL(siteUrl);
    if (destination.protocol !== "https:" && destination.hostname !== "localhost") {
      throw new Error("SITE_URL must use HTTPS");
    }

    const query = new URL(request.url).searchParams;
    const form = request.method === "POST" ? await request.formData() : null;
    const orderNo = String(form?.get("tran_id") ?? form?.get("value_a") ?? query.get("tran_id") ?? "");
    const result = query.get("result");
    if (!/^SJ-\d{4}-\d{4,}$/.test(orderNo) || !["success", "failed", "cancelled"].includes(result ?? "")) {
      return jsonResponse({ error: "Invalid payment return" }, 400);
    }

    destination.pathname = `/order-success/${encodeURIComponent(orderNo)}`;
    destination.search = new URLSearchParams({ payment: result ?? "pending" }).toString();
    return Response.redirect(destination.toString(), 303);
  } catch (error) {
    console.error("SSLCommerz return failed", error instanceof Error ? error.message : "unknown error");
    return jsonResponse({ error: "Payment return could not be processed" }, 500);
  }
});
