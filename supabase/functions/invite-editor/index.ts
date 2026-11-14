// Owner-only editor administration. Deploy as Supabase Edge Function "invite-editor".
// Secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceKey || !anonKey) return json({ error: "Edge Function secrets are not configured." }, 500);

  const authHeader = req.headers.get("Authorization") || "";
  const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await callerClient.auth.getUser();
  if (userError || !user) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(url, serviceKey);
  const { data: callerRole, error: roleLookupError } = await admin
    .from("admin_users").select("role").eq("user_id", user.id).maybeSingle();
  if (roleLookupError || callerRole?.role !== "owner") return json({ error: "Owner access required" }, 403);

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "invite");

  if (action === "list") {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return json({ error: error.message }, 400);
    const { data: roles, error: rolesError } = await admin.from("admin_users").select("user_id,role,created_at");
    if (rolesError) return json({ error: rolesError.message }, 400);
    const roleMap = new Map((roles || []).map((r: { user_id: string; role: string; created_at: string }) => [r.user_id, r]));
    const users = (data.users || []).filter((u) => roleMap.has(u.id)).map((u) => ({
      user_id: u.id, email: u.email || "", role: roleMap.get(u.id)?.role || "editor",
      created_at: roleMap.get(u.id)?.created_at || u.created_at,
      banned_until: u.banned_until || null, last_sign_in_at: u.last_sign_in_at || null,
      is_owner: roleMap.get(u.id)?.role === "owner",
    }));
    return json({ users });
  }

  if (action === "invite") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Valid email required" }, 400);
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: body.redirectTo || undefined });
    if (error) return json({ error: error.message }, 400);
    const { error: roleError } = await admin.from("admin_users").upsert({ user_id: data.user.id, role: "editor" }, { onConflict: "user_id" });
    if (roleError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return json({ error: roleError.message }, 500);
    }
    return json({ ok: true, email, user_id: data.user.id });
  }

  const targetId = String(body.user_id || "");
  if (!targetId) return json({ error: "User ID required" }, 400);
  const { data: target, error: targetError } = await admin.from("admin_users")
    .select("user_id,role").eq("user_id", targetId).maybeSingle();
  if (targetError || !target) return json({ error: "CMS user not found" }, 404);
  if (target.role === "owner" || target.user_id === user.id) return json({ error: "Owner account cannot be changed here" }, 403);

  if (action === "set-active") {
    const active = Boolean(body.active);
    const { error } = await admin.auth.admin.updateUserById(targetId, {
      ban_duration: active ? "none" : "876000h",
    });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, active });
  }
  if (action === "remove") {
    const { error } = await admin.auth.admin.deleteUser(targetId);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }
  return json({ error: "Unsupported action" }, 400);
});
