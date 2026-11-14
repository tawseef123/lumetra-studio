// Deploy as Supabase Edge Function: invite-editor
// Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as function secrets.
// The service-role key must never be exposed to browser code.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const authHeader = req.headers.get("Authorization") || "";
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await callerClient.auth.getUser();
  if (userError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createClient(url, serviceKey);
  const { data: callerRole } = await admin.from("admin_users").select("role").eq("user_id", user.id).maybeSingle();
  if (callerRole?.role !== "owner") return Response.json({ error: "Owner access required" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Valid email required" }, { status: 400 });
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: body.redirectTo || undefined });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  const { error: roleError } = await admin.from("admin_users").upsert({ user_id: data.user.id, role: "editor" }, { onConflict: "user_id" });
  if (roleError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return Response.json({ error: roleError.message }, { status: 500 });
  }
  return Response.json({ ok: true, email, user_id: data.user.id });
});
