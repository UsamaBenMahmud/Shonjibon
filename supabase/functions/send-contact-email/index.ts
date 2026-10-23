import {
  allowSubmission,
  corsHeaders,
  isEmail,
  jsonResponse,
  sendResendEmail,
  serviceClient,
} from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await request.json();
    if (body?.company) return jsonResponse({ ok: true });
    if (
      typeof body?.name !== "string" || body.name.trim().length < 2 ||
      !isEmail(body.email) ||
      typeof body?.subject !== "string" || body.subject.trim().length < 2 ||
      typeof body?.message !== "string" || body.message.trim().length < 10
    ) {
      return jsonResponse({ error: "তথ্য যাচাই করুন / Please check the form fields" }, 400);
    }

    const client = serviceClient();
    if (!(await allowSubmission(client, "contact", request))) {
      return jsonResponse({ error: "অনেকবার চেষ্টা করা হয়েছে / Too many submissions; try again later" }, 429);
    }
    const { error } = await client.from("contact_messages").insert({
      name: body.name.trim(),
      email: body.email.trim(),
      phone: typeof body.phone === "string" ? body.phone.trim() : "",
      subject: body.subject.trim(),
      message: body.message.trim(),
      is_read: false,
    });
    if (error) throw error;

    const recipient = Deno.env.get("CONTACT_NOTIFICATION_EMAIL");
    if (recipient) {
      try {
        await sendResendEmail(
          recipient,
          `Shonjibon contact: ${body.subject.trim()}`,
          `From: ${body.name.trim()} <${body.email.trim()}>\nPhone: ${body.phone ?? ""}\n\n${body.message.trim()}`,
        );
      } catch (emailError) {
        console.error("Contact email delivery failed", emailError instanceof Error ? emailError.message : "unknown error");
      }
    } else {
      console.error("Contact email delivery skipped: CONTACT_NOTIFICATION_EMAIL is not configured");
    }
    return jsonResponse({ ok: true }, 201);
  } catch (error) {
    console.error("Contact submission failed", error instanceof Error ? error.message : "unknown error");
    return jsonResponse({ error: "বার্তা পাঠানো যায়নি / Could not send the message" }, 500);
  }
});
