-- Phase 6: lightweight operator activity trail for commercial order workflow.
-- The activity table is read-only to browser roles; rows are emitted by a narrow
-- SECURITY DEFINER trigger when meaningful order workflow fields change.

BEGIN;

CREATE TABLE IF NOT EXISTS public.order_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES public."user"(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created',
    'customer_changed',
    'wedding_changed',
    'payment_status_changed',
    'production_status_changed',
    'revision_count_changed'
  )),
  from_value TEXT,
  to_value TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_activity_owner_created
  ON public.order_activity(owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_activity_order_created
  ON public.order_activity(order_id, created_at DESC);

ALTER TABLE public.order_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_activity_owner_select ON public.order_activity;
CREATE POLICY order_activity_owner_select ON public.order_activity
  FOR SELECT TO authenticated
  USING (owner_user_id = app_private.current_better_auth_user_id());

REVOKE ALL ON TABLE public.order_activity FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.order_activity TO authenticated;

CREATE OR REPLACE FUNCTION app_private.record_order_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app_private, public, pg_temp
AS $$
DECLARE
  actor TEXT;
BEGIN
  actor := app_private.current_better_auth_user_id();
  IF actor IS NULL OR actor = '' THEN
    actor := NEW.owner_user_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_activity (
      owner_user_id, order_id, actor_user_id, event_type, to_value, metadata
    ) VALUES (
      NEW.owner_user_id,
      NEW.id,
      actor,
      'created',
      NEW.production_status,
      jsonb_build_object(
        'payment_status', NEW.payment_status,
        'package_name', NEW.package_name,
        'price_amount', NEW.price_amount,
        'currency', NEW.currency
      )
    );
    RETURN NEW;
  END IF;

  IF OLD.customer_id IS DISTINCT FROM NEW.customer_id THEN
    INSERT INTO public.order_activity (
      owner_user_id, order_id, actor_user_id, event_type, from_value, to_value
    ) VALUES (
      NEW.owner_user_id, NEW.id, actor, 'customer_changed',
      OLD.customer_id::text, NEW.customer_id::text
    );
  END IF;

  IF OLD.wedding_id IS DISTINCT FROM NEW.wedding_id THEN
    INSERT INTO public.order_activity (
      owner_user_id, order_id, actor_user_id, event_type, from_value, to_value
    ) VALUES (
      NEW.owner_user_id, NEW.id, actor, 'wedding_changed',
      OLD.wedding_id::text, NEW.wedding_id::text
    );
  END IF;

  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    INSERT INTO public.order_activity (
      owner_user_id, order_id, actor_user_id, event_type, from_value, to_value
    ) VALUES (
      NEW.owner_user_id, NEW.id, actor, 'payment_status_changed',
      OLD.payment_status, NEW.payment_status
    );
  END IF;

  IF OLD.production_status IS DISTINCT FROM NEW.production_status THEN
    INSERT INTO public.order_activity (
      owner_user_id, order_id, actor_user_id, event_type, from_value, to_value
    ) VALUES (
      NEW.owner_user_id, NEW.id, actor, 'production_status_changed',
      OLD.production_status, NEW.production_status
    );
  END IF;

  IF OLD.revision_count IS DISTINCT FROM NEW.revision_count THEN
    INSERT INTO public.order_activity (
      owner_user_id, order_id, actor_user_id, event_type, from_value, to_value
    ) VALUES (
      NEW.owner_user_id, NEW.id, actor, 'revision_count_changed',
      OLD.revision_count::text, NEW.revision_count::text
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app_private.record_order_activity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS orders_record_activity ON public.orders;
CREATE TRIGGER orders_record_activity
AFTER INSERT OR UPDATE OF customer_id, wedding_id, payment_status, production_status, revision_count
ON public.orders
FOR EACH ROW EXECUTE FUNCTION app_private.record_order_activity();

COMMIT;
