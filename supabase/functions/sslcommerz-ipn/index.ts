import { corsHeaders, jsonResponse, serviceClient } from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const storeId = Deno.env.get("SSLCOMMERZ_STORE_ID");
    const storePassword = Deno.env.get("SSLCOMMERZ_STORE_PASSWORD");
    if (!storeId || !storePassword) throw new Error("SSLCommerz credentials are not configured");

    const payload = await request.formData();
    const validationId = String(payload.get("val_id") ?? "");
    const orderNo = String(payload.get("tran_id") ?? payload.get("value_a") ?? "");
    if (!validationId || !/^SJ-\d{4}-\d{4,}$/.test(orderNo)) {
      return jsonResponse({ error: "Invalid payment notification" }, 400);
    }

    const client = serviceClient();
    const { data: order, error: orderError } = await client.from("orders")
      .select("total,payment_status,payment_method")
      .eq("order_no", orderNo)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order || order.payment_method !== "sslcommerz") {
      return jsonResponse({ error: "Order not found" }, 404);
    }
    if (order.payment_status === "paid") return jsonResponse({ ok: true });

    const mode = Deno.env.get("SSLCOMMERZ_MODE") === "live" ? "live" : "sandbox";
    const validationEndpoint = mode === "live"
      ? "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
      : "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";
    const validationUrl = new URL(validationEndpoint);
    validationUrl.search = new URLSearchParams({
      val_id: validationId,
      store_id: storeId,
      store_passwd: storePassword,
      format: "json",
    }).toString();
    const response = await fetch(validationUrl);
    if (!response.ok) throw new Error(`SSLCommerz validation failed (${response.status})`);
    const validation = await response.json() as {
      status?: string;
      tran_id?: string;
      amount?: string;
      currency?: string;
      currency_type?: string;
    };
    const paidAmount = Number(validation.amount);
    if (
      !["VALID", "VALIDATED"].includes(validation.status ?? "") ||
      validation.tran_id !== orderNo ||
      (validation.currency_type ?? validation.currency) !== "BDT" ||
      !Number.isFinite(paidAmount) ||
      Math.abs(paidAmount - Number(order.total)) > 0.01
    ) {
      console.error("SSLCommerz payment did not validate", orderNo, validation.status ?? "unknown");
      return jsonResponse({ error: "Payment validation failed" }, 400);
    }

    const { error: updateError } = await client.from("orders")
      .update({ payment_status: "paid" })
      .eq("order_no", orderNo)
      .eq("payment_status", "pending");
    if (updateError) throw updateError;
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("SSLCommerz IPN failed", error instanceof Error ? error.message : "unknown error");
    return jsonResponse({ error: "Payment notification could not be processed" }, 500);
  }
});
