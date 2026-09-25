/*
# Saved Cards Table

1. Overview
   Stores Paystack card authorization codes so users can charge their wallet
   instantly without re-entering card details or OTP. When a user's first
   Paystack payment succeeds, the authorization object from the verified
   transaction is saved here. Future funding calls Paystack's "charge"
   endpoint with the saved authorization_code — no redirect, no OTP.

2. New Table
   - saved_cards:
     - id (uuid, PK)
     - user_id (uuid, FK profiles, owner-scoped)
     - authorization_code (text) — Paystack authorization code for charging
     - card_type (text) — e.g. "visa", "mastercard"
     - last4 (text) — last 4 digits of the card
     - exp_month (text)
     - exp_year (text)
     - bank (text) — issuing bank name
     - brand (text) — human-readable brand string from Paystack
     - is_active (boolean, default true) — can be deactivated if card expires/fails
     - created_at, updated_at (timestamptz)

3. Security
   - RLS enabled, owner-scoped (authenticated, auth.uid = user_id)
   - 4 CRUD policies: select, insert, update, delete
   - The authorization_code is a Paystack token that can only be used with the
     Paystack secret key (server-side), so even if a user reads their own row,
     they cannot use it to charge outside our platform.

4. Notes
   - A user can have multiple saved cards.
   - The paystack-charge edge function uses the service role key to call
     Paystack's charge endpoint with the stored authorization_code.
*/

CREATE TABLE IF NOT EXISTS saved_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  authorization_code text NOT NULL,
  card_type text DEFAULT '',
  last4 text DEFAULT '',
  exp_month text DEFAULT '',
  exp_year text DEFAULT '',
  bank text DEFAULT '',
  brand text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_cards" ON saved_cards;
CREATE POLICY "select_own_cards" ON saved_cards FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cards" ON saved_cards;
CREATE POLICY "insert_own_cards" ON saved_cards FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cards" ON saved_cards;
CREATE POLICY "update_own_cards" ON saved_cards FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cards" ON saved_cards;
CREATE POLICY "delete_own_cards" ON saved_cards FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_cards_user ON saved_cards(user_id, is_active);
