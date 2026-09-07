-- Phase 5.1-5.3: owner-scoped customers, orders, and manual payment tracking.
-- Managed-service V1 keeps commercial records private to the wedding owner/operator.

BEGIN;

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 160),
  phone TEXT NOT NULL CHECK (char_length(btrim(phone)) BETWEEN 3 AND 64),
  email TEXT CHECK (email IS NULL OR char_length(email) <= 254),
  notes TEXT NOT NULL DEFAULT '' CHECK (char_length(notes) <= 5000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_owner_updated
  ON public.customers(owner_user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_owner_name
  ON public.customers(owner_user_id, name);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  wedding_id UUID UNIQUE REFERENCES public.weddings(id) ON DELETE SET NULL,
  package_name TEXT NOT NULL CHECK (char_length(btrim(package_name)) BETWEEN 1 AND 80),
  template_id TEXT NOT NULL CHECK (char_length(btrim(template_id)) BETWEEN 1 AND 120),
  price_amount BIGINT NOT NULL DEFAULT 0 CHECK (price_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'IDR' CHECK (currency ~ '^[A-Z]{3}$'),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  production_status TEXT NOT NULL DEFAULT 'new'
    CHECK (production_status IN (
      'new',
      'waiting_data',
      'in_progress',
      'preview_ready',
      'revision',
      'approved',
      'published',
      'completed',
      'cancelled'
    )),
  revision_count INTEGER NOT NULL DEFAULT 0 CHECK (revision_count >= 0),
  notes TEXT NOT NULL DEFAULT '' CHECK (char_length(notes) <= 5000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_owner_updated
  ON public.orders(owner_user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_owner_production
  ON public.orders(owner_user_id, production_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_owner_payment
  ON public.orders(owner_user_id, payment_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer
  ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_wedding
  ON public.orders(wedding_id)
  WHERE wedding_id IS NOT NULL;

CREATE OR REPLACE FUNCTION app_private.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = app_private, public, pg_temp
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS customers_touch_updated_at ON public.customers;
CREATE TRIGGER customers_touch_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION app_private.touch_updated_at();

DROP TRIGGER IF EXISTS orders_touch_updated_at ON public.orders;
CREATE TRIGGER orders_touch_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION app_private.touch_updated_at();

CREATE OR REPLACE FUNCTION app_private.enforce_commerce_order_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = NEW.customer_id
      AND c.owner_user_id = NEW.owner_user_id
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'order customer must belong to the same owner';
  END IF;

  IF NEW.wedding_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.wedding_collaborators wc
    WHERE wc.wedding_id = NEW.wedding_id
      AND wc.user_id = NEW.owner_user_id
      AND wc.role = 'owner'
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'order wedding must be owned by the same operator';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_enforce_scope ON public.orders;
CREATE TRIGGER orders_enforce_scope
BEFORE INSERT OR UPDATE OF owner_user_id, customer_id, wedding_id ON public.orders
FOR EACH ROW EXECUTE FUNCTION app_private.enforce_commerce_order_scope();

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customers_owner_select ON public.customers;
CREATE POLICY customers_owner_select ON public.customers
  FOR SELECT TO authenticated
  USING (owner_user_id = app_private.current_better_auth_user_id());

DROP POLICY IF EXISTS customers_owner_insert ON public.customers;
CREATE POLICY customers_owner_insert ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = app_private.current_better_auth_user_id());

DROP POLICY IF EXISTS customers_owner_update ON public.customers;
CREATE POLICY customers_owner_update ON public.customers
  FOR UPDATE TO authenticated
  USING (owner_user_id = app_private.current_better_auth_user_id())
  WITH CHECK (owner_user_id = app_private.current_better_auth_user_id());

DROP POLICY IF EXISTS customers_owner_delete ON public.customers;
CREATE POLICY customers_owner_delete ON public.customers
  FOR DELETE TO authenticated
  USING (owner_user_id = app_private.current_better_auth_user_id());

DROP POLICY IF EXISTS orders_owner_select ON public.orders;
CREATE POLICY orders_owner_select ON public.orders
  FOR SELECT TO authenticated
  USING (owner_user_id = app_private.current_better_auth_user_id());

DROP POLICY IF EXISTS orders_owner_insert ON public.orders;
CREATE POLICY orders_owner_insert ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = app_private.current_better_auth_user_id());

DROP POLICY IF EXISTS orders_owner_update ON public.orders;
CREATE POLICY orders_owner_update ON public.orders
  FOR UPDATE TO authenticated
  USING (owner_user_id = app_private.current_better_auth_user_id())
  WITH CHECK (owner_user_id = app_private.current_better_auth_user_id());

DROP POLICY IF EXISTS orders_owner_delete ON public.orders;
CREATE POLICY orders_owner_delete ON public.orders
  FOR DELETE TO authenticated
  USING (owner_user_id = app_private.current_better_auth_user_id());

REVOKE ALL ON TABLE public.customers FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.orders FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO authenticated;

REVOKE ALL ON FUNCTION app_private.touch_updated_at() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app_private.enforce_commerce_order_scope() FROM PUBLIC, anon;

COMMIT;
