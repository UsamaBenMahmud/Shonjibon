import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, serviceClient } from "../_shared/http.ts";

type AdminAction = "create" | "update" | "delete";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const authorization = request.headers.get("Authorization");
    const token = authorization?.replace(/^Bearer\s+/i, "");
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!token || !url || !anonKey) return jsonResponse({ error: "Authentication required" }, 401);

    const authClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) return jsonResponse({ error: "Authentication required" }, 401);

    const client = serviceClient();
    const { data: actor, error: actorError } = await client
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (actorError) throw actorError;
    if (actor?.role !== "super_admin") return jsonResponse({ error: "Super admin role required" }, 403);

    const body = await request.json();
    const action = body?.action as AdminAction;
    if (!["create", "update", "delete"].includes(action)) {
      return jsonResponse({ error: "Invalid action" }, 400);
    }

    if (action === "create") {
      const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const role = body.role;
      if (fullName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["editor", "super_admin"].includes(role)) {
        return jsonResponse({ error: "তথ্য যাচাই করুন / Please check the form fields" }, 400);
      }
      const { data: invited, error: inviteError } = await client.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
      });
      if (inviteError) throw inviteError;
      const { error: profileError } = await client.from("profiles").upsert({
        id: invited.user.id,
        email,
        full_name: fullName,
        role,
      }, { onConflict: "id" });
      if (profileError) {
        const { error: cleanupError } = await client.auth.admin.deleteUser(invited.user.id);
        if (cleanupError) throw new Error(`${profileError.message}; auth cleanup failed: ${cleanupError.message}`);
        throw profileError;
      }
      return jsonResponse({ id: invited.user.id }, 201);
    }

    const id = body.id;
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) {
      return jsonResponse({ error: "Invalid user id" }, 400);
    }
    if (action === "delete") {
      if (id === authData.user.id) return jsonResponse({ error: "You cannot delete your own account" }, 400);
      const { data: target, error: targetError } = await client.from("profiles").select("role").eq("id", id).maybeSingle();
      if (targetError) throw targetError;
      if (!target) return jsonResponse({ error: "User not found" }, 404);
      if (target.role === "super_admin") {
        const { count, error: countError } = await client
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "super_admin");
        if (countError) throw countError;
        if ((count ?? 0) <= 1) return jsonResponse({ error: "At least one super admin must remain" }, 400);
      }
      const { error } = await client.auth.admin.deleteUser(id);
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
    const role = body.role;
    if (fullName.length < 2 || !["editor", "super_admin"].includes(role)) {
      return jsonResponse({ error: "তথ্য যাচাই করুন / Please check the form fields" }, 400);
    }
    const { data: target, error: targetError } = await client.from("profiles").select("role").eq("id", id).maybeSingle();
    if (targetError) throw targetError;
    if (!target) return jsonResponse({ error: "User not found" }, 404);
    if (target.role === "super_admin" && role !== "super_admin") {
      const { count, error: countError } = await client
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "super_admin");
      if (countError) throw countError;
      if ((count ?? 0) <= 1) return jsonResponse({ error: "At least one super admin must remain" }, 400);
    }
    const { error } = await client.from("profiles").update({ full_name: fullName, role }).eq("id", id);
    if (error) throw error;
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error("Admin user management failed", error instanceof Error ? error.message : "unknown error");
    return jsonResponse({ error: "ব্যবহারকারী আপডেট ব্যর্থ / User management failed" }, 500);
  }
});
