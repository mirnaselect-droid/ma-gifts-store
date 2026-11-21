import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return json({ error: "AUTH_REQUIRED" }, 401);

    const url = Deno.env.get("SUPABASE_URL");
    const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}");
    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    const publishableKey = publishableKeys.default;
    const secretKey = secretKeys.default;
    if (!url || !publishableKey || !secretKey) {
      console.error("Required Supabase function environment is missing");
      return json({ error: "SERVER_CONFIGURATION_ERROR" }, 500);
    }

    const userClient = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !userData.user) return json({ error: "AUTH_REQUIRED" }, 401);

    const body = await req.json();
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0 || rawItems.length > 50) return json({ error: "INVALID_CART" }, 400);

    const items = rawItems.map((item: Record<string, unknown>) => ({
      product_id: item.product_id ?? item.id,
      quantity: item.quantity ?? item.qty,
    }));
    if (items.some((item: { product_id: unknown; quantity: unknown }) =>
      typeof item.product_id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.product_id) ||
      !Number.isInteger(Number(item.quantity)) ||
      Number(item.quantity) < 1 || Number(item.quantity) > 20
    )) return json({ error: "INVALID_CART_ITEM" }, 400);

    const admin = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.rpc("create_customer_order_secure", {
      p_user_id: userData.user.id,
      p_customer_name: body.customer_name,
      p_customer_email: userData.user.email ?? null,
      p_customer_phone: body.customer_phone,
      p_country: body.country,
      p_city: body.city,
      p_shipping_address: body.shipping_address,
      p_notes: body.notes ?? "",
      p_payment_method: body.payment_method,
      p_items: items,
    });

    if (error) {
      const message = error.message ?? "";
      console.error("Order creation rejected:", message);
      if (message.includes("OUT_OF_STOCK")) return json({ error: "OUT_OF_STOCK" }, 409);
      if (message.includes("PRODUCT_UNAVAILABLE")) return json({ error: "PRODUCT_UNAVAILABLE" }, 409);
      if (message.includes("INVALID_") || message.includes("MIXED_CURRENCIES")) return json({ error: "INVALID_ORDER", detail: message }, 400);
      return json({ error: "ORDER_CREATION_FAILED" }, 500);
    }
    return json({ order: data });
  } catch (error) {
    console.error("Order function error:", error);
    return json({ error: "INVALID_REQUEST" }, 400);
  }
});
