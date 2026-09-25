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
    const RELOADLY_KEY = Deno.env.get("RELOADLY_SECRET_KEY");
    const RELOADLY_CLIENT_ID = Deno.env.get("RELOADLY_CLIENT_ID");

    if (!RELOADLY_KEY || !RELOADLY_CLIENT_ID) {
      return new Response(
        JSON.stringify({ error: "Reloadly is not configured. Add RELOADLY_CLIENT_ID and RELOADLY_SECRET_KEY as secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resp = await fetch("https://auth.reloadly.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: RELOADLY_CLIENT_ID,
        client_secret: RELOADLY_KEY,
        grant_type: "client_credentials",
        audience: "https://giftcards.reloadly.com",
      }),
    });

    const data = await resp.json();

    if (!data.access_token) {
      return new Response(
        JSON.stringify({ error: data.message || "Failed to get Reloadly token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ access_token: data.access_token, expires_in: data.expires_in }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
