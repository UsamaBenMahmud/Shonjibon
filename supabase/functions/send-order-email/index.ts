import { createClient } from "npm:@supabase/supabase-js@2";
import { allowSubmission, corsHeaders, jsonResponse, sendResendEmail, serviceClient } from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await request.json();
    const items = body?.items;
    const providedCustomer = body?.customer;
    if (!providedCustomer || typeof providedCustomer !== "object" || !Array.isArray(items) || items.length === 0) {
      return jsonResponse({ error: "অর্ডারের তথ্য সঠিক নয় / Invalid order details" }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const bearer = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!url || !anonKey) throw new Error("Supabase authentication is not configured");
    let userId: string | null = null;
    if (bearer && bearer !== anonKey) {
      const authClient = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: authData, error: authError } = await authClient.auth.getUser(bearer);
      if (authError || !authData.user) return jsonResponse({ error: "Authentication required" }, 401);
      userId = authData.user.id;
    }
    const customer = {
      customer_name: providedCustomer.customer_name,
      phone: providedCustomer.phone,
      email: providedCustomer.email,
      address: providedCustomer.address,
      district: providedCustomer.district,
      note: providedCustomer.note,
      payment_method: ["bank_transfer", "mobile_money", "sslcommerz"].includes(providedCustomer.payment_method)
        ? providedCustomer.payment_method
        : "cash_on_delivery",
      user_id: userId,
    };

    const client = serviceClient();
    if (!(await allowSubmission(client, "orders", request))) {
      return jsonResponse({ error: "অনেকবার চেষ্টা করা হয়েছে / Too many submissions; try again later" }, 429);
    }

    if (customer.payment_method === "sslcommerz"
      && (!Deno.env.get("SSLCOMMERZ_STORE_ID") || !Deno.env.get("SSLCOMMERZ_STORE_PASSWORD"))) {
      return jsonResponse({ error: "অনলাইন পেমেন্ট কনফিগার করা নেই / Online payment is not configured" }, 503);
    }
    const { data: orderNo, error } = await client.rpc("create_order", { customer, items });
    if (error) {
      console.error("create_order RPC failed", error.code ?? error.message);
      return jsonResponse({ error: "অর্ডার করা যায়নি / Could not place the order" }, 400);
    }
    if (typeof orderNo !== "string") return jsonResponse({ error: "Invalid order response" }, 500);

    const recipient = Deno.env.get("ORDER_NOTIFICATION_EMAIL");
    if (recipient) {
      try {
        await sendResendEmail(
          recipient,
          `New Shonjibon order ${orderNo}`,
          `Order: ${orderNo}\nCustomer: ${customer.customer_name}\nPhone: ${customer.phone}\nDistrict: ${customer.district}`,
        );
      } catch (emailError) {
        console.error("Order email delivery failed", emailError instanceof Error ? emailError.message : "unknown error");
      }
    } else {
      console.error("Order email delivery skipped: ORDER_NOTIFICATION_EMAIL is not configured");
    }
    let paymentUrl: string | undefined;
    if (customer.payment_method === "sslcommerz") {
      const { data: order, error: orderError } = await client.from("orders")
        .select("total,order_no,customer_name,phone,email,address,district")
        .eq("order_no", orderNo).single();
      if (orderError) throw orderError;
      const result = await startSslCommerzPayment(order);
      paymentUrl = result;
    }
    return jsonResponse({ order_no: orderNo, ...(paymentUrl ? { payment_url: paymentUrl } : {}) }, 201);
  } catch (error) {
    console.error("Order submission failed", error instanceof Error ? error.message : "unknown error");
    return jsonResponse({ error: "সার্ভারে সমস্যা হয়েছে / Order service unavailable" }, 500);
  }
});

async function startSslCommerzPayment(order: {
  total: number;
  order_no: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  district: string;
}): Promise<string> {
  const storeId = Deno.env.get("SSLCOMMERZ_STORE_ID");
  const storePassword = Deno.env.get("SSLCOMMERZ_STORE_PASSWORD");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const siteUrl = Deno.env.get("SITE_URL");
  if (!storeId || !storePassword || !supabaseUrl || !siteUrl) {
    throw new Error("Online payment settings are incomplete");
  }
  const mode = Deno.env.get("SSLCOMMERZ_MODE") === "live" ? "live" : "sandbox";
  const gatewayUrl = mode === "live"
    ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
    : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";
  const functionsUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1`;
  const form = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePassword,
    total_amount: Number(order.total).toFixed(2),
    currency: "BDT",
    tran_id: order.order_no,
    success_url: `${functionsUrl}/sslcommerz-return?result=success`,
    fail_url: `${functionsUrl}/sslcommerz-return?result=failed`,
    cancel_url: `${functionsUrl}/sslcommerz-return?result=cancelled`,
    ipn_url: `${functionsUrl}/sslcommerz-ipn`,
    shipping_method: "NO",
    product_name: "Shonjibon order",
    product_category: "Water and shell-based products",
    product_profile: "general",
    cus_name: order.customer_name,
    cus_email: order.email || "customer@example.com",
    cus_phone: order.phone,
    cus_add1: order.address,
    cus_city: order.district,
    cus_country: "Bangladesh",
    value_a: order.order_no,
  });
  const response = await fetch(gatewayUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!response.ok) throw new Error(`SSLCommerz initialization failed (${response.status})`);
  const payload = await response.json() as { status?: string; GatewayPageURL?: string; failedreason?: string };
  if (payload.status !== "SUCCESS" || !payload.GatewayPageURL) {
    throw new Error(payload.failedreason || "SSLCommerz did not return a payment URL");
  }
  const gatewayPage = new URL(payload.GatewayPageURL);
  if (gatewayPage.protocol !== "https:" || !gatewayPage.hostname.endsWith(".sslcommerz.com")) {
    throw new Error("SSLCommerz returned an invalid payment URL");
  }
  return gatewayPage.toString();
}
