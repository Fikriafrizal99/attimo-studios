-- Phase 5.1-5.3 commerce operations verification.
-- Safe to run repeatedly: all test data is rolled back.

\set ON_ERROR_STOP on

BEGIN;

INSERT INTO public."user" (id, name, email, "emailVerified") VALUES
  ('phase5-owner-a', 'Phase 5 Owner A', 'phase5-owner-a@example.test', TRUE),
  ('phase5-owner-b', 'Phase 5 Owner B', 'phase5-owner-b@example.test', TRUE);

-- Privileged setup for tenant B.
INSERT INTO public.weddings (
  id, slug, status, template_id, sections, content, theme
) VALUES (
  '51515151-5151-4515-8515-515151515151',
  'phase5-owner-b-wedding',
  'draft',
  'classic-001',
  '[]',
  '{}',
  '{}'
);
INSERT INTO public.wedding_collaborators (wedding_id, user_id, role)
VALUES ('51515151-5151-4515-8515-515151515151', 'phase5-owner-b', 'owner');
INSERT INTO public.customers (id, owner_user_id, name, phone)
VALUES ('52525252-5252-4525-8525-525252525252', 'phase5-owner-b', 'Customer B', '080000000002');
INSERT INTO public.orders (
  id, owner_user_id, customer_id, wedding_id, package_name, template_id, price_amount
) VALUES (
  '53535353-5353-4535-8535-535353535353',
  'phase5-owner-b',
  '52525252-5252-4525-8525-525252525252',
  '51515151-5151-4515-8515-515151515151',
  'Premium',
  'classic-001',
  250000
);

SET LOCAL ROLE authenticated;
SELECT set_config('app.better_auth_user_id', 'phase5-owner-a', true);

DO $$
DECLARE
  created JSONB;
  own_wedding_id UUID;
  own_customer_id UUID;
  own_order_id UUID;
  blocked BOOLEAN;
BEGIN
  created := app_private.create_wedding_for_current_user(
    'classic-001',
    '[]'::jsonb,
    '{"phase5":"owner-a"}'::jsonb,
    '{}'::jsonb
  );
  own_wedding_id := (created->>'id')::uuid;

  INSERT INTO public.customers (owner_user_id, name, phone, email, notes)
  VALUES ('phase5-owner-a', 'Customer A', '080000000001', 'customer-a@example.test', 'test')
  RETURNING id INTO own_customer_id;

  INSERT INTO public.orders (
    owner_user_id,
    customer_id,
    wedding_id,
    package_name,
    template_id,
    price_amount,
    payment_status,
    production_status
  ) VALUES (
    'phase5-owner-a',
    own_customer_id,
    own_wedding_id,
    'Basic',
    'classic-001',
    100000,
    'partial',
    'in_progress'
  ) RETURNING id INTO own_order_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.customers WHERE id = own_customer_id
  ) THEN
    RAISE EXCEPTION 'Phase 5 verification failed: owner cannot read own customer';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.orders WHERE id = own_order_id
  ) THEN
    RAISE EXCEPTION 'Phase 5 verification failed: owner cannot read own order';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.customers
    WHERE id = '52525252-5252-4525-8525-525252525252'
  ) THEN
    RAISE EXCEPTION 'Phase 5 verification failed: customer RLS leaked another owner';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = '53535353-5353-4535-8535-535353535353'
  ) THEN
    RAISE EXCEPTION 'Phase 5 verification failed: order RLS leaked another owner';
  END IF;

  blocked := FALSE;
  BEGIN
    INSERT INTO public.customers (owner_user_id, name, phone)
    VALUES ('phase5-owner-b', 'Cross Tenant Customer', '080099999999');
  EXCEPTION WHEN insufficient_privilege THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 5 verification failed: owner could create customer for another tenant';
  END IF;

  blocked := FALSE;
  BEGIN
    INSERT INTO public.orders (
      owner_user_id, customer_id, package_name, template_id, price_amount
    ) VALUES (
      'phase5-owner-a',
      '52525252-5252-4525-8525-525252525252',
      'Invalid Cross Customer',
      'classic-001',
      1
    );
  EXCEPTION WHEN check_violation THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 5 verification failed: order accepted another owner customer';
  END IF;

  blocked := FALSE;
  BEGIN
    UPDATE public.orders
       SET wedding_id = '51515151-5151-4515-8515-515151515151'
     WHERE id = own_order_id;
  EXCEPTION WHEN check_violation THEN
    blocked := TRUE;
  END;
  IF NOT blocked THEN
    RAISE EXCEPTION 'Phase 5 verification failed: order accepted another owner wedding';
  END IF;

  UPDATE public.orders
     SET payment_status = 'paid',
         production_status = 'approved',
         revision_count = 2
   WHERE id = own_order_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = own_order_id
      AND payment_status = 'paid'
      AND production_status = 'approved'
      AND revision_count = 2
  ) THEN
    RAISE EXCEPTION 'Phase 5 verification failed: valid operational status update failed';
  END IF;
END $$;

RESET ROLE;
ROLLBACK;

SELECT 'Phase 5.1 commerce operations verification passed' AS result;
