import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getReloadlyToken() {
  const RELOADLY_KEY = Deno.env.get("RELOADLY_SECRET_KEY");
  const RELOADLY_CLIENT_ID = Deno.env.get("RELOADLY_CLIENT_ID");

  if (!RELOADLY_KEY || !RELOADLY_CLIENT_ID) {
    throw new Error("Reloadly is not configured. Add RELOADLY_CLIENT_ID and RELOADLY_SECRET_KEY as secrets.");
  }

  const resp = await fetch("https://auth.reloadly.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: RELOADLY_CLIENT_ID,
      client_secret: RELOADLY_KEY,
      grant_type: "client_credentials",
      audience: "https://topups.reloadly.com",
    }),
  });

  const data = await resp.json();
  if (!data.access_token) throw new Error(data.message || "Failed to get Reloadly token");
  return data.access_token as string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { operator_id, amount, recipient, recipient_phone, user_email, order_ref } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct wallet
    const { error: deductErr } = await supabase.rpc("deduct_wallet", {
      p_user_id: userData.user.id,
      p_amount: amount,
      p_description: `Airtime purchase - ₦${amount} to ${recipient}`,
      p_reference: order_ref,
    });

    if (deductErr) {
      const msg = deductErr.message.includes("Insufficient balance")
        ? "Insufficient wallet balance"
        : deductErr.message;
      return new Response(JSON.stringify({ error: msg }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create order record
    const { data: order } = await supabase
      .from("orders")
      .insert({
        user_id: userData.user.id,
        service_type: "airtime",
        product_code: String(operator_id),
        recipient,
        amount,
        status: "pending",
        provider_ref: order_ref,
      })
      .select()
      .maybeSingle();

    // Call Reloadly
    let providerSuccess = false;
    let providerResponse: Record<string, unknown> = {};
    let providerRef = "";

    try {
      const accessToken = await getReloadlyToken();

      const topupResp = await fetch("https://topups.reloadly.com/topups", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operatorId: Number(operator_id),
          amount,
          recipient: recipient_phone || recipient,
          customIdentifier: order_ref,
        }),
      });

      providerResponse = await topupResp.json();

      if (topupResp.ok && providerResponse.transactionId) {
        providerSuccess = true;
        providerRef = String(providerResponse.transactionId);
      }
    } catch (providerErr) {
      providerResponse = { error: providerErr.message };
    }

    // Update order
    await supabase
      .from("orders")
      .update({
        status: providerSuccess ? "success" : "failed",
        provider_ref: providerRef,
        provider_response: providerResponse,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order?.id);

    // Refund if failed
    if (!providerSuccess) {
      await supabase.rpc("refund_wallet", {
        p_user_id: userData.user.id,
        p_amount: amount,
        p_description: `Refund for failed airtime purchase`,
        p_reference: `refund-${order_ref}`,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: "Airtime purchase failed. Your wallet has been refunded.",
          order_id: order?.id,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Airtime of ₦${amount} delivered to ${recipient}`,
        order_id: order?.id,
        provider_ref: providerRef,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
