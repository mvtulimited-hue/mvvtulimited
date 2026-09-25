import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { amount, email } = await req.json();

    if (!amount || amount < 100) {
      return new Response(
        JSON.stringify({ error: "Minimum funding amount is ₦100" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const reference = `MVTU-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    const { error: insertErr } = await supabase
      .from("payment_references")
      .insert({
        user_id: userData.user.id,
        reference,
        amount,
        status: "pending",
      });

    if (insertErr) throw insertErr;

    const PAYSTACK_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_KEY) {
      return new Response(
        JSON.stringify({ error: "Paystack is not configured. Add PAYSTACK_SECRET_KEY as a secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callbackUrl = `${new URL(req.url).origin}/functions/v1/paystack-verify`;

    const resp = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYSTACK_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100,
        reference,
        callback_url: callbackUrl,
        metadata: { user_id: userData.user.id, purpose: "wallet_funding" },
      }),
    });

    const data = await resp.json();

    if (!data.status) {
      return new Response(
        JSON.stringify({ error: data.message || "Paystack initialization failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference,
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
