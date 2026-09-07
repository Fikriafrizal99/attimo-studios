-- Phase 6 order activity verification.
-- Safe to run repeatedly: all test data is rolled back.

\set ON_ERROR_STOP on

BEGIN;

INSERT INTO public."user" (id, name, email, "emailVerified") VALUES
  ('phase6-owner-a', 'Phase 6 Owner A', 'phase6-owner-a@example.test', TRUE),
  ('phase6-owner-b', 'Phase 6 Owner B', 'phase6-owner-b@example.test', TRUE);

-- Seed tenant B as privileged setup.
INSERT INTO public.customers (id, owner_user_id, name, phone)
VALUES ('62626262-6262-4626-8626-626262626262', 'phase6-owner-b', 'Phase 6 Customer B', '080000000062');
INSERT INTO public.orders (
  id, owner_user_id, customer_id, package_name, template_id, price_amount
) VALUES (
  '63636363-6363-4636-8636-636363636363',
  'phase6-owner-b',
  '62626262-6262-4626-8626-626262626262',
  'Basic',
  'classic-001',
  100000
);

SET LOCAL ROLE authenticated;
SELECT set_config('app.better_auth_user_id', 'phase6-owner-a', true);

DO $$
DECLARE
  customer_id UUID;
  order_id UUID;
  create_events INTEGER;
  status_events INTEGER;
  payment_events INTEGER;
  revision_events INTEGER;
  direct_insert_blocked BOOLEAN := FALSE;
BEGIN
  INSERT INTO public.customers (owner_user_id, name, phone)
  VALUES ('phase6-owner-a', 'Phase 6 Customer A', '080000000061')
  RETURNING id INTO customer_id;

  INSERT INTO public.orders (
    owner_user_id,
    customer_id,
    package_name,
    template_id,
    price_amount,
    payment_status,
    production_status
  ) VALUES (
    'phase6-owner-a',
    customer_id,
    'Premium',
    'classic-001',
    250000,
    'unpaid',
    'new'
  ) RETURNING id INTO order_id;

  UPDATE public.orders
     SET production_status = 'in_progress',
         payment_status = 'partial',
         revision_count = 1
   WHERE id = order_id;

  SELECT COUNT(*) INTO create_events
    FROM public.order_activity
   WHERE order_id = order_id
     AND event_type = 'created';

  SELECT COUNT(*) INTO status_events
    FROM public.order_activity oa
   WHERE oa.order_id = order_id
     AND oa.event_type = 'production_status_changed'
     AND oa.from_value = 'new'
     AND oa.to_value = 'in_progress';

  SELECT COUNT(*) INTO payment_events
    FROM public.order_activity oa
   WHERE oa.order_id = order_id
     AND oa.event_type = 'payment_status_changed'
     AND oa.from_value = 'unpaid'
     AND oa.to_value = 'partial';

  SELECT COUNT(*) INTO revision_events
    FROM public.order_activity oa
   WHERE oa.order_id = order_id
     AND oa.event_type = 'revision_count_changed'
     AND oa.from_value = '0'
     AND oa.to_value = '1';

  IF create_events <> 1 OR status_events <> 1 OR payment_events <> 1 OR revision_events <> 1 THEN
    RAISE EXCEPTION 'Phase 6 verification failed: expected activity events were not emitted';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.order_activity
    WHERE order_id = '63636363-6363-4636-8636-636363636363'
  ) THEN
    RAISE EXCEPTION 'Phase 6 verification failed: activity RLS leaked another owner';
  END IF;

  BEGIN
    INSERT INTO public.order_activity (
      owner_user_id, order_id, actor_user_id, event_type
    ) VALUES (
      'phase6-owner-a', order_id, 'phase6-owner-a', 'created'
    );
  EXCEPTION WHEN insufficient_privilege THEN
    direct_insert_blocked := TRUE;
  END;

  IF NOT direct_insert_blocked THEN
    RAISE EXCEPTION 'Phase 6 verification failed: browser role can insert activity directly';
  END IF;
END $$;

RESET ROLE;
ROLLBACK;

SELECT 'Phase 6.1 order activity verification passed' AS result;
