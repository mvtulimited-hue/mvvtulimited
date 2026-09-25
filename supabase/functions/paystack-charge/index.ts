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
    const { amount, email, card_id } = await req.json();

    if (!amount || amount < 100) {
      return new Response(
        JSON.stringify({ error: "Minimum funding amount is ₦100" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!card_id) {
      return new Response(
        JSON.stringify({ error: "No card selected" }),
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

    // Fetch the saved card — verify it belongs to this user
    const { data: card, error: cardErr } = await supabase
      .from("saved_cards")
      .select("*")
      .eq("id", card_id)
      .eq("user_id", userData.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (cardErr || !card) {
      return new Response(
        JSON.stringify({ error: "Saved card not found. Please use a different payment method." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PAYSTACK_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_KEY) {
      return new Response(
        JSON.stringify({ error: "Paystack is not configured. Add PAYSTACK_SECRET_KEY as a secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reference = `MVTU-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    // Record the payment reference as pending
    const { error: insertErr } = await supabase
      .from("payment_references")
      .insert({
        user_id: userData.user.id,
        reference,
        amount,
        status: "pending",
      });

    if (insertErr) throw insertErr;

    // Charge the saved authorization code directly — no redirect, no OTP
    const chargeResp = await fetch("https://api.paystack.co/transaction/charge_authorization", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYSTACK_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100,
        authorization_code: card.authorization_code,
        reference,
        metadata: { user_id: userData.user.id, purpose: "wallet_funding_saved_card" },
      }),
    });

    const chargeData = await chargeResp.json();

    if (!chargeData.status) {
      await supabase
        .from("payment_references")
        .update({
          status: "failed",
          paystack_response: chargeData,
          updated_at: new Date().toISOString(),
        })
        .eq("reference", reference);

      // If the authorization is no longer valid, deactivate the card
      if (chargeData.data?.response_code === "03" || chargeData.message?.includes("invalid") || chargeData.message?.includes("expired")) {
        await supabase
          .from("saved_cards")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("id", card_id);
      }

      return new Response(
        JSON.stringify({
          error: chargeData.message || "Card charge failed. Please try a different payment method.",
          card_deactivated: chargeData.data?.response_code === "03",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the charge was actually successful
    const txStatus = chargeData.data?.status;

    if (txStatus === "success") {
      await supabase
        .from("payment_references")
        .update({
          status: "success",
          paystack_response: chargeData.data,
          updated_at: new Date().toISOString(),
        })
        .eq("reference", reference);

      const { data: newBalance } = await supabase.rpc("credit_wallet", {
        p_user_id: userData.user.id,
        p_amount: amount,
        p_description: `Wallet funding via saved card (****${card.last4})`,
        p_reference: reference,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Wallet funded with ${amount} NGN`,
          reference,
          new_balance: newBalance,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If status is pending or requires OTP (shouldn't happen for saved auth, but handle it)
    await supabase
      .from("payment_references")
      .update({
        status: "failed",
        paystack_response: chargeData.data,
        updated_at: new Date().toISOString(),
      })
      .eq("reference", reference);

    return new Response(
      JSON.stringify({
        error: `Card charge returned status: ${txStatus}. Please try again or use a different card.`,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
