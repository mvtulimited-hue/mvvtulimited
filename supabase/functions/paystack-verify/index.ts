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
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference") || url.searchParams.get("trxref");

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Missing transaction reference" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: payRef, error: refErr } = await supabase
      .from("payment_references")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();

    if (refErr || !payRef) {
      return new Response(
        JSON.stringify({ error: "Transaction reference not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payRef.status === "success") {
      const redirectUrl = `${new URL(req.url).origin}/dashboard/wallet?status=success&ref=${reference}`;
      return Response.redirect(redirectUrl, 302);
    }

    const PAYSTACK_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_KEY) {
      return new Response(
        JSON.stringify({ error: "Paystack is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verifyResp = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { "Authorization": `Bearer ${PAYSTACK_KEY}` },
    });

    const verifyData = await verifyResp.json();

    if (verifyData.status && verifyData.data.status === "success") {
      await supabase
        .from("payment_references")
        .update({
          status: "success",
          paystack_response: verifyData.data,
          updated_at: new Date().toISOString(),
        })
        .eq("reference", reference);

      await supabase.rpc("credit_wallet", {
        p_user_id: payRef.user_id,
        p_amount: payRef.amount,
        p_description: `Wallet funding via Paystack`,
        p_reference: reference,
      });

      // Save card authorization for future one-click funding
      const auth = verifyData.data?.authorization;
      if (auth && auth.authorization_code && auth.reusable) {
        // Avoid duplicates: check if this card already saved
        const { data: existing } = await supabase
          .from("saved_cards")
          .select("id")
          .eq("user_id", payRef.user_id)
          .eq("authorization_code", auth.authorization_code)
          .maybeSingle();

        if (!existing) {
          await supabase.from("saved_cards").insert({
            user_id: payRef.user_id,
            authorization_code: auth.authorization_code,
            card_type: auth.card_type || "",
            last4: auth.last4 || "",
            exp_month: String(auth.exp_month || ""),
            exp_year: String(auth.exp_year || ""),
            bank: auth.bank || "",
            brand: auth.brand || "",
            is_active: true,
          });
        }
      }

      const redirectUrl = `${new URL(req.url).origin}/dashboard/wallet?status=success&ref=${reference}`;
      return Response.redirect(redirectUrl, 302);
    } else {
      await supabase
        .from("payment_references")
        .update({
          status: "failed",
          paystack_response: verifyData,
          updated_at: new Date().toISOString(),
        })
        .eq("reference", reference);

      const redirectUrl = `${new URL(req.url).origin}/dashboard/wallet?status=failed&ref=${reference}`;
      return Response.redirect(redirectUrl, 302);
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
