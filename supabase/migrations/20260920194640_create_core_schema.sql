/*
# M VTU LTD — Core Database Schema

Creates the core tables for a Nigerian VTU platform that sells airtime, data bundles,
and gift cards. Users fund their wallet via Paystack, then purchase services fulfilled
through the Reloadly aggregator.

New Tables:
- profiles: extends auth.users with wallet balance, phone, full name
- wallet_transactions: ledger of all money in/out
- orders: every airtime/data/giftcard purchase with provider status
- service_catalog: available services (networks, data plans, gift card brands)
- payment_references: Paystack transaction references

Security:
- profiles, wallet_transactions, orders, payment_references: owner-scoped (authenticated)
- service_catalog: public read (anon + authenticated)
- SECURITY DEFINER functions: credit_wallet, deduct_wallet, refund_wallet
- Auto-create profile trigger on signup
*/

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('funding', 'purchase', 'refund', 'bonus');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE service_type AS ENUM ('airtime', 'data', 'giftcard');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'success', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  phone text UNIQUE,
  wallet_balance numeric(18,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount numeric(18,2) NOT NULL,
  balance_after numeric(18,2) NOT NULL,
  description text DEFAULT '',
  reference text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wallet_tx" ON wallet_transactions;
CREATE POLICY "select_own_wallet_tx" ON wallet_transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_wallet_tx" ON wallet_transactions;
CREATE POLICY "insert_own_wallet_tx" ON wallet_transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_type service_type NOT NULL,
  product_code text DEFAULT '',
  recipient text NOT NULL,
  amount numeric(18,2) NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'pending',
  provider_ref text DEFAULT '',
  provider_response jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_orders" ON orders;
CREATE POLICY "select_own_orders" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_orders" ON orders;
CREATE POLICY "update_own_orders" ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type service_type NOT NULL,
  provider_code text NOT NULL DEFAULT '',
  product_code text NOT NULL DEFAULT '',
  label text NOT NULL,
  amount numeric(18,2),
  currency text DEFAULT 'NGN',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_service_catalog" ON service_catalog;
CREATE POLICY "read_service_catalog" ON service_catalog FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS payment_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reference text UNIQUE NOT NULL,
  amount numeric(18,2) NOT NULL,
  provider text DEFAULT 'paystack',
  status payment_status NOT NULL DEFAULT 'pending',
  paystack_response jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payments" ON payment_references;
CREATE POLICY "select_own_payments" ON payment_references FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_payments" ON payment_references;
CREATE POLICY "insert_own_payments" ON payment_references FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_payments" ON payment_references;
CREATE POLICY "update_own_payments" ON payment_references FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payment_references(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_type ON service_catalog(service_type, is_active);

CREATE OR REPLACE FUNCTION credit_wallet(p_user_id uuid, p_amount numeric, p_description text, p_reference text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance numeric(18,2);
BEGIN
  UPDATE profiles SET wallet_balance = wallet_balance + p_amount, updated_at = now()
    WHERE id = p_user_id
    RETURNING wallet_balance INTO v_new_balance;

  INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference)
    VALUES (p_user_id, 'funding', p_amount, v_new_balance, p_description, p_reference);

  RETURN v_new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION deduct_wallet(p_user_id uuid, p_amount numeric, p_description text, p_reference text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current numeric(18,2);
  v_new_balance numeric(18,2);
BEGIN
  SELECT wallet_balance INTO v_current FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_current < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE profiles SET wallet_balance = wallet_balance - p_amount, updated_at = now()
    WHERE id = p_user_id
    RETURNING wallet_balance INTO v_new_balance;

  INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference)
    VALUES (p_user_id, 'purchase', -p_amount, v_new_balance, p_description, p_reference);

  RETURN v_new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION refund_wallet(p_user_id uuid, p_amount numeric, p_description text, p_reference text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance numeric(18,2);
BEGIN
  UPDATE profiles SET wallet_balance = wallet_balance + p_amount, updated_at = now()
    WHERE id = p_user_id
    RETURNING wallet_balance INTO v_new_balance;

  INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, reference)
    VALUES (p_user_id, 'refund', p_amount, v_new_balance, p_description, p_reference);

  RETURN v_new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION credit_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION refund_wallet TO authenticated;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
